"use client";

import { useState, useEffect } from "react";
import { 
  BookOpen, 
  Users, 
  Calendar, 
  AlertTriangle, 
  Mail, 
  Plus, 
  RefreshCw, 
  Check, 
  X, 
  ArrowRightLeft, 
  Clock, 
  ChevronRight, 
  Info,
  Trash2
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

// Helper to format date
const formatDate = (dateObj) => {
  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
};

// Formats string date
const formatDateStr = (dateStr) => {
  if (!dateStr) return "";
  const dateObj = new Date(dateStr);
  return formatDate(dateObj);
};

// Get difference in days
const getDaysDiff = (date1, date2) => {
  const d1 = new Date(date1.toISOString().split("T")[0]);
  const d2 = new Date(date2.toISOString().split("T")[0]);
  const diffTime = d1 - d2;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Initial Mock Data Helpers (generating ISO dates relative to runtime)
const getPastDateStr = (daysAgo) => {
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
};
const getFutureDateStr = (daysAhead) => {
  return new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
};

const initialMembers = [
  { id: "m1", name: "Jane Doe", email: "jane@example.com", joinDate: "2026-01-15" },
  { id: "m2", name: "John Smith", email: "john@example.com", joinDate: "2026-02-10" },
  { id: "m3", name: "Alice Cooper", email: "alice@example.com", joinDate: "2026-03-05" }
];

const initialBooks = [
  {
    id: "b1",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    genre: "Classic Fiction",
    status: "Available",
    borrowerId: null,
    borrowerName: null,
    checkoutDate: null,
    dueDate: null,
    renewalCount: 0,
    lastNotificationDate: null,
    notificationCount: 0
  },
  {
    id: "b2",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    genre: "Classic Fiction",
    status: "Checked Out",
    borrowerId: "m1",
    borrowerName: "Jane Doe",
    checkoutDate: getPastDateStr(20),
    dueDate: getPastDateStr(6), // Due 6 days ago (overdue)
    renewalCount: 1,
    lastNotificationDate: getPastDateStr(6),
    notificationCount: 1
  },
  {
    id: "b3",
    title: "1984",
    author: "George Orwell",
    genre: "Dystopian",
    status: "Checked Out",
    borrowerId: "m2",
    borrowerName: "John Smith",
    checkoutDate: getPastDateStr(5),
    dueDate: getFutureDateStr(9),
    renewalCount: 0,
    lastNotificationDate: null,
    notificationCount: 0
  },
  {
    id: "b4",
    title: "Dune",
    author: "Frank Herbert",
    genre: "Sci-Fi",
    status: "Available",
    borrowerId: null,
    borrowerName: null,
    checkoutDate: null,
    dueDate: null,
    renewalCount: 0,
    lastNotificationDate: null,
    notificationCount: 0
  },
  {
    id: "b5",
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    genre: "Fantasy",
    status: "Checked Out",
    borrowerId: "m3",
    borrowerName: "Alice Cooper",
    checkoutDate: getPastDateStr(35),
    dueDate: getPastDateStr(7), // Due 7 days ago (overdue)
    renewalCount: 2, // Max renewals used!
    lastNotificationDate: null,
    notificationCount: 0
  }
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("books");
  
  // App States
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [timeOffset, setTimeOffset] = useState(0); // Offset in days
  const [notificationLogs, setNotificationLogs] = useState([]);
  
  // Toast notifications
  const [toastMessage, setToastMessage] = useState(null);
  
  // Form States
  const [newBook, setNewBook] = useState({ title: "", author: "", genre: "" });
  const [newMember, setNewMember] = useState({ name: "", email: "" });
  
  // Circulation Selection
  const [checkoutData, setCheckoutData] = useState({ bookId: "", memberId: "" });
  
  // Email Simulator Modal State
  const [activeNoticeModal, setActiveNoticeModal] = useState(null); // Overdue book object
  
  // Hydration fix & LocalStorage Sync
  useEffect(() => {
  setMounted(true);
  const fetchData = async () => {
    // Fetch books
    const { data: booksData, error: booksError } = await supabase
      .from('books')
      .select('*');
    if (booksError) {
      console.error('Error fetching books:', booksError);
    }
    setBooks(booksData ?? []);

    // Fetch members
    const { data: membersData, error: membersError } = await supabase
      .from('members')
      .select('*');
    if (membersError) {
      console.error('Error fetching members:', membersError);
    }
    setMembers(membersData ?? []);

    // Fetch notification logs (optional)
    const { data: logsData, error: logsError } = await supabase
      .from('notification_logs')
      .select('*');
    if (logsError) console.error('Error fetching logs:', logsError);
    setNotificationLogs(logsData ?? []);
  };
  fetchData();
}, []);

  useEffect(() => {
    if (mounted) {
      const upsertBooks = async () => {
        await supabase.from('books').upsert(books);
      };
      upsertBooks();
    }
  }, [books, mounted]);

  useEffect(() => {
    if (mounted) {
      const upsertMembers = async () => {
        await supabase.from('members').upsert(members);
      };
      upsertMembers();
    }
  }, [members, mounted]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("book_club_offset", String(timeOffset));
    }
  }, [timeOffset, mounted]);

  useEffect(() => {
    if (mounted) {
      const upsertLogs = async () => {
        await supabase.from('notification_logs').upsert(notificationLogs);
      };
      upsertLogs();
    }
  }, [notificationLogs, mounted]);

  // Show Toast Helper
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Get current Simulated Date object
  const getSimulatedDate = () => {
    return new Date(Date.now() + timeOffset * 24 * 60 * 60 * 1000);
  };

  const simulatedDateStr = formatDate(getSimulatedDate());

  // Date controls
  const addDaysToOffset = (days) => {
    setTimeOffset(prev => prev + days);
    showToast(`Time traveled +${days} days!`);
  };

  const resetTimeOffset = () => {
    setTimeOffset(0);
    showToast("System time reset to actual today.");
  };

  // Calculations
  const isBookOverdue = (book) => {
    if (book.status !== "Checked Out" || !book.dueDate) return false;
    const due = new Date(book.dueDate);
    const simulatedToday = getSimulatedDate();
    // Compare date strings to ignore precise hours
    return due < new Date(simulatedToday.toISOString().split("T")[0]);
  };

  const getOverdueDays = (book) => {
    if (!book.dueDate) return 0;
    const due = new Date(book.dueDate);
    const simulatedToday = getSimulatedDate();
    return getDaysDiff(simulatedToday, due);
  };

  const getNotificationStatus = (book) => {
    if (!isBookOverdue(book)) return { eligible: false, text: "Not overdue" };
    
    const simulatedToday = getSimulatedDate();
    
    // Eligible for first notification if count is 0
    if (book.notificationCount === 0) {
      return { eligible: true, text: "Ready: First Notice", reason: "initial" };
    }
    
    // Eligible for recurring notification every 2 weeks (14 days)
    const lastNotice = new Date(book.lastNotificationDate || book.dueDate);
    const daysSinceLastNotice = getDaysDiff(simulatedToday, lastNotice);
    
    if (daysSinceLastNotice >= 14) {
      return { 
        eligible: true, 
        text: `Ready: Notice #${book.notificationCount + 1}`, 
        reason: "recurring",
        daysElapsed: daysSinceLastNotice
      };
    } else {
      const daysUntilNext = 14 - daysSinceLastNotice;
      return { 
        eligible: false, 
        text: `Notice sent (Next in ${daysUntilNext}d)`, 
        reason: "pending",
        daysRemaining: daysUntilNext
      };
    }
  };

  // Stats
  const totalBooks = books.length;
  const booksBorrowed = books.filter(b => b.status === "Checked Out").length;
  const overdueCount = books.filter(b => isBookOverdue(b)).length;
  const totalMembersCount = members.length;

  // Book Handlers
  const handleAddBook = (e) => {
    e.preventDefault();
    if (!newBook.title || !newBook.author) return;
    
    const id = "b_" + Date.now();
    const newBookObj = {
      id,
      title: newBook.title,
      author: newBook.author,
      genre: newBook.genre || "General",
      status: "Available",
      borrowerId: null,
      borrowerName: null,
      checkoutDate: null,
      dueDate: null,
      renewalCount: 0,
      lastNotificationDate: null,
      notificationCount: 0
    };
    
    setBooks(prev => [...prev, newBookObj]);
    setNewBook({ title: "", author: "", genre: "" });
    showToast(`"${newBookObj.title}" added to the library.`);
  };

  const handleDeleteBook = (id, title) => {
    if (confirm(`Are you sure you want to remove "${title}" from the catalog?`)) {
      setBooks(prev => prev.filter(b => b.id !== id));
      showToast(`Removed "${title}" from catalog.`);
    }
  };

  // Member Handlers
  const handleAddMember = (e) => {
    e.preventDefault();
    if (!newMember.name || !newMember.email) return;
    
    const id = "m_" + Date.now();
    const newMemberObj = {
      id,
      name: newMember.name,
      email: newMember.email,
      joinDate: getSimulatedDate().toISOString().split("T")[0]
    };
    
    setMembers(prev => [...prev, newMemberObj]);
    setNewMember({ name: "", email: "" });
    showToast(`Member "${newMemberObj.name}" successfully registered.`);
  };

  const handleDeleteMember = (id, name) => {
    const isBorrowing = books.some(b => b.borrowerId === id);
    if (isBorrowing) {
      alert(`Cannot delete ${name} because they currently have checked-out books.`);
      return;
    }
    if (confirm(`Are you sure you want to remove member "${name}"?`)) {
      setMembers(prev => prev.filter(m => m.id !== id));
      showToast(`Member "${name}" removed.`);
    }
  };

  // Circulation Actions
  const handleCheckOut = (e) => {
    e.preventDefault();
    const { bookId, memberId } = checkoutData;
    if (!bookId || !memberId) return;

    const book = books.find(b => b.id === bookId);
    const member = members.find(m => m.id === memberId);
    if (!book || !member) return;

    const simulatedToday = getSimulatedDate();
    // Default loan is 2 weeks (14 days)
    const dueDateObj = new Date(simulatedToday.getTime() + 14 * 24 * 60 * 60 * 1000);
    
    setBooks(prev => prev.map(b => {
      if (b.id === bookId) {
        return {
          ...b,
          status: "Checked Out",
          borrowerId: member.id,
          borrowerName: member.name,
          checkoutDate: simulatedToday.toISOString().split("T")[0],
          dueDate: dueDateObj.toISOString().split("T")[0],
          renewalCount: 0,
          lastNotificationDate: null,
          notificationCount: 0
        };
      }
      return b;
    }));

    setCheckoutData({ bookId: "", memberId: "" });
    showToast(`"${book.title}" checked out to ${member.name}. Due on ${formatDate(dueDateObj)}.`);
  };

  const handleRenew = (bookId) => {
    const book = books.find(b => b.id === bookId);
    if (!book || book.renewalCount >= 2) return;

    const currentDue = new Date(book.dueDate);
    // Extend due date by 2 weeks (14 days)
    const newDueObj = new Date(currentDue.getTime() + 14 * 24 * 60 * 60 * 1000);

    setBooks(prev => prev.map(b => {
      if (b.id === bookId) {
        return {
          ...b,
          dueDate: newDueObj.toISOString().split("T")[0],
          renewalCount: b.renewalCount + 1,
          // When a book is renewed, reset notification counts, since it is no longer past its new due date
          notificationCount: 0,
          lastNotificationDate: null
        };
      }
      return b;
    }));

    showToast(`Renewed "${book.title}". New due date: ${formatDate(newDueObj)} (${book.renewalCount + 1}/2 renewals used).`);
  };

  const handleReturn = (bookId) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    setBooks(prev => prev.map(b => {
      if (b.id === bookId) {
        return {
          ...b,
          status: "Available",
          borrowerId: null,
          borrowerName: null,
          checkoutDate: null,
          dueDate: null,
          renewalCount: 0,
          lastNotificationDate: null,
          notificationCount: 0
        };
      }
      return b;
    }));

    showToast(`"${book.title}" returned to library.`);
  };

  // Notification simulator trigger
  const handleSendReminder = () => {
    if (!activeNoticeModal) return;
    
    const book = activeNoticeModal;
    const member = members.find(m => m.id === book.borrowerId);
    if (!member) return;

    const simulatedToday = getSimulatedDate();
    
    // Add to simulated logs
    const newLog = {
      id: "log_" + Date.now(),
      dateStr: simulatedToday.toISOString().split("T")[0],
      recipientEmail: member.email,
      recipientName: member.name,
      bookTitle: book.title,
      dueDate: book.dueDate,
      noticeNumber: book.notificationCount + 1,
      overdueDays: getOverdueDays(book)
    };

    setNotificationLogs(prev => [newLog, ...prev]);

    // Update Book state
    setBooks(prev => prev.map(b => {
      if (b.id === book.id) {
        return {
          ...b,
          lastNotificationDate: simulatedToday.toISOString().split("T")[0],
          notificationCount: b.notificationCount + 1
        };
      }
      return b;
    }));

    showToast(`Notification sent to ${member.name} (${member.email})`);
    setActiveNoticeModal(null);
  };

  const clearLogs = () => {
    if (confirm("Are you sure you want to clear the notification logs?")) {
      setNotificationLogs([]);
      showToast("Notification log cleared.");
    }
  };

  if (!mounted) return null; // Avoid Next.js hydration issues

  return (
    <div className="container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast">
          <Check size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header section */}
      <header className="header">
        <div className="logo-section">
          <BookOpen className="logo-icon" size={32} />
          <div>
            <h1>Book Club Library</h1>
            <p>Admin Control Dashboard</p>
          </div>
        </div>

        {/* Time Simulator Panel */}
        <div className="card" style={{ padding: "0.75rem 1.25rem", display: "flex", alignItems: "center", gap: "16px", background: "rgba(139, 92, 246, 0.05)" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold" }}>System Date Simulator</span>
            <span style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
              <Clock size={16} /> {simulatedDateStr}
            </span>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button className="btn btn-secondary btn-sm" onClick={() => addDaysToOffset(7)}>+7 Days</button>
            <button className="btn btn-secondary btn-sm" onClick={() => addDaysToOffset(14)}>+14 Days</button>
            {timeOffset !== 0 && (
              <button className="btn btn-danger btn-sm" onClick={resetTimeOffset}>Reset</button>
            )}
          </div>
        </div>
      </header>

      {/* Stats Counter Rows */}
      <section className="stats-grid">
        <div className="card stat-card">
          <div className="stat-icon">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="stat-value">{totalBooks}</div>
            <div className="stat-label">Total Books</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ color: "var(--secondary)" }}>
            <ArrowRightLeft size={24} />
          </div>
          <div>
            <div className="stat-value">{booksBorrowed}</div>
            <div className="stat-label">In Circulation</div>
          </div>
        </div>
        <div className="card stat-card overdue" style={{ borderLeft: overdueCount > 0 ? "3px solid var(--danger)" : "1px solid var(--border-color)" }}>
          <div className="stat-icon" style={{ color: overdueCount > 0 ? "var(--danger)" : "var(--text-muted)" }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="stat-value" style={{ color: overdueCount > 0 ? "var(--danger)" : "var(--text-main)" }}>{overdueCount}</div>
            <div className="stat-label">Overdue Books</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ color: "var(--success)" }}>
            <Users size={24} />
          </div>
          <div>
            <div className="stat-value">{totalMembersCount}</div>
            <div className="stat-label">Active Members</div>
          </div>
        </div>
      </section>

      {/* Tab Menu */}
      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === "books" ? "active" : ""}`} 
          onClick={() => setActiveTab("books")}
        >
          📚 Book Catalog
        </button>
        <button 
          className={`tab-btn ${activeTab === "members" ? "active" : ""}`} 
          onClick={() => setActiveTab("members")}
        >
          👥 Members Registry
        </button>
        <button 
          className={`tab-btn ${activeTab === "circulation" ? "active" : ""}`} 
          onClick={() => setActiveTab("circulation")}
        >
          🔄 Circulation Desk
        </button>
        <button 
          className={`tab-btn ${activeTab === "notifications" ? "active" : ""}`} 
          onClick={() => setActiveTab("notifications")}
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
        >
          ⚠️ Overdue Alerts
          {overdueCount > 0 && (
            <span style={{ background: "var(--danger)", color: "#fff", borderRadius: "50%", padding: "2px 6px", fontSize: "0.7rem", fontWeight: "bold" }}>
              {overdueCount}
            </span>
          )}
        </button>
      </div>

      {/* Main Sections */}

      {/* 1. Books Catalog Tab */}
      {activeTab === "books" && (
        <div className="grid-2">
          {/* Main Book List */}
          <div>
            <h2 style={{ borderLeftColor: "var(--primary)" }}>Library Collection</h2>
            <div className="book-grid">
              {books.map(book => {
                const overdue = isBookOverdue(book);
                return (
                  <div key={book.id} className="card book-card" style={{ borderTop: overdue ? "3px solid var(--danger)" : "1px solid var(--border-color)" }}>
                    <div className="book-cover-placeholder">
                      <BookOpen size={48} style={{ opacity: 0.15, marginBottom: "8px" }} />
                      <span className="badge badge-info" style={{ fontSize: "0.65rem" }}>{book.genre}</span>
                    </div>
                    
                    <h3 className="book-title">{book.title}</h3>
                    <p className="book-author">by {book.author}</p>
                    
                    <div style={{ margin: "10px 0" }}>
                      <div className="book-info-row">
                        <span className="book-info-label">Status</span>
                        <span className={`badge ${book.status === "Available" ? "badge-success" : "badge-warning"}`}>
                          {book.status}
                        </span>
                      </div>
                      
                      {book.status === "Checked Out" && (
                        <>
                          <div className="book-info-row">
                            <span className="book-info-label">Borrower</span>
                            <span className="book-info-value">{book.borrowerName}</span>
                          </div>
                          <div className="book-info-row">
                            <span className="book-info-label">Due Date</span>
                            <span className="book-info-value" style={{ color: overdue ? "var(--danger)" : "var(--text-main)", fontWeight: overdue ? "bold" : "normal" }}>
                              {formatDateStr(book.dueDate)}
                            </span>
                          </div>
                          <div className="book-info-row">
                            <span className="book-info-label">Renewals Used</span>
                            <span className="book-info-value">{book.renewalCount} / 2</span>
                          </div>
                          {overdue && (
                            <div className="book-info-row">
                              <span className="book-info-label" style={{ color: "var(--danger)" }}>Overdue By</span>
                              <span className="book-info-value" style={{ color: "var(--danger)", fontWeight: "bold" }}>
                                {getOverdueDays(book)} days
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className="book-actions">
                      {book.status === "Checked Out" && (
                        <>
                          <button 
                            className="btn btn-primary btn-sm"
                            disabled={book.renewalCount >= 2}
                            onClick={() => handleRenew(book.id)}
                            style={{ flex: 1 }}
                            title={book.renewalCount >= 2 ? "Maximum 2 renewals reached" : "Extend borrowing by 2 weeks"}
                          >
                            <RefreshCw size={14} /> Renew ({book.renewalCount}/2)
                          </button>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleReturn(book.id)}
                          >
                            Return
                          </button>
                        </>
                      )}
                      
                      {book.status === "Available" && (
                        <button 
                          className="btn btn-secondary btn-sm"
                          style={{ flex: 1 }}
                          onClick={() => {
                            setCheckoutData({ bookId: book.id, memberId: "" });
                            setActiveTab("circulation");
                          }}
                        >
                          Check Out
                        </button>
                      )}
                      
                      <button 
                        className="btn btn-danger btn-sm"
                        style={{ padding: "6px" }}
                        onClick={() => handleDeleteBook(book.id, book.title)}
                        title="Delete Book"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Book Sidebar */}
          <div>
            <h2>Add New Book</h2>
            <div className="card">
              <form onSubmit={handleAddBook}>
                <div className="form-group">
                  <label htmlFor="title">Book Title</label>
                  <input 
                    type="text" 
                    id="title" 
                    className="form-control" 
                    placeholder="e.g. The Hobbit"
                    value={newBook.title}
                    onChange={(e) => setNewBook(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="author">Author</label>
                  <input 
                    type="text" 
                    id="author" 
                    className="form-control" 
                    placeholder="e.g. J.R.R. Tolkien"
                    value={newBook.author}
                    onChange={(e) => setNewBook(prev => ({ ...prev, author: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="genre">Genre</label>
                  <select 
                    id="genre" 
                    className="form-control"
                    value={newBook.genre}
                    onChange={(e) => setNewBook(prev => ({ ...prev, genre: e.target.value }))}
                  >
                    <option value="">Select a Genre</option>
                    <option value="Classic Fiction">Classic Fiction</option>
                    <option value="Fantasy">Fantasy</option>
                    <option value="Sci-Fi">Sci-Fi</option>
                    <option value="Dystopian">Dystopian</option>
                    <option value="Mystery">Mystery</option>
                    <option value="Biography">Biography</option>
                    <option value="General">General / Other</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem" }}>
                  <Plus size={16} /> Add Book
                </button>
              </form>
            </div>
            
            <div className="card" style={{ marginTop: "1.5rem", borderLeft: "3px solid var(--secondary)" }}>
              <h4 style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", color: "var(--secondary)" }}>
                <Info size={16} /> Loan Policy
              </h4>
              <p style={{ fontSize: "0.85rem", lineHeight: "1.5" }}>
                Books can be borrowed for **2 weeks (14 days)**. Each book is eligible for a maximum of **2 renewals** (adding 2 weeks each time) if it is not returned. Alerts flag when books are past their return date.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Members Registry Tab */}
      {activeTab === "members" && (
        <div className="grid-2">
          {/* Members Table */}
          <div>
            <h2>Registered Members</h2>
            <div className="card" style={{ padding: "0" }}>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Member Name</th>
                      <th>Email Address</th>
                      <th>Join Date</th>
                      <th>Books Borrowed</th>
                      <th style={{ width: "80px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(member => {
                      const activeBorrows = books.filter(b => b.borrowerId === member.id).length;
                      return (
                        <tr key={member.id}>
                          <td style={{ fontWeight: "600" }}>{member.name}</td>
                          <td style={{ color: "var(--text-muted)" }}>{member.email}</td>
                          <td>{formatDateStr(member.joinDate)}</td>
                          <td>
                            <span className={`badge ${activeBorrows > 0 ? "badge-info" : "badge-secondary"}`} style={{ background: activeBorrows > 0 ? "var(--secondary-glow)" : "rgba(255,255,255,0.03)", borderColor: activeBorrows > 0 ? "var(--secondary)" : "rgba(255,255,255,0.08)" }}>
                              {activeBorrows} active
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button 
                              className="btn btn-danger btn-sm"
                              style={{ padding: "6px" }}
                              onClick={() => handleDeleteMember(member.id, member.name)}
                              title="Remove Member"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Add Member Sidebar */}
          <div>
            <h2>Register Member</h2>
            <div className="card">
              <form onSubmit={handleAddMember}>
                <div className="form-group">
                  <label htmlFor="memberName">Full Name</label>
                  <input 
                    type="text" 
                    id="memberName" 
                    className="form-control" 
                    placeholder="e.g. Jane Doe"
                    value={newMember.name}
                    onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="memberEmail">Email Address</label>
                  <input 
                    type="email" 
                    id="memberEmail" 
                    className="form-control" 
                    placeholder="e.g. jane@example.com"
                    value={newMember.email}
                    onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem" }}>
                  <Plus size={16} /> Register Member
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 3. Circulation Desk Tab */}
      {activeTab === "circulation" && (
        <div className="grid-2">
          {/* Checkout Card */}
          <div>
            <h2>Book Check Out</h2>
            <div className="card">
              <form onSubmit={handleCheckOut}>
                <div className="form-group">
                  <label htmlFor="checkoutBook">Select Book</label>
                  <select 
                    id="checkoutBook" 
                    className="form-control"
                    value={checkoutData.bookId}
                    onChange={(e) => setCheckoutData(prev => ({ ...prev, bookId: e.target.value }))}
                    required
                  >
                    <option value="">-- Choose an Available Book --</option>
                    {books.filter(b => b.status === "Available").map(book => (
                      <option key={book.id} value={book.id}>{book.title} (by {book.author})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="checkoutMember">Select Borrower</label>
                  <select 
                    id="checkoutMember" 
                    className="form-control"
                    value={checkoutData.memberId}
                    onChange={(e) => setCheckoutData(prev => ({ ...prev, memberId: e.target.value }))}
                    required
                  >
                    <option value="">-- Choose a Member --</option>
                    {members.map(member => (
                      <option key={member.id} value={member.id}>{member.name} ({member.email})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ margin: "1.5rem 0", padding: "10px", background: "rgba(255,255,255,0.02)", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "4px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Simulated Checkout Date:</span>
                    <span style={{ fontWeight: "600" }}>{simulatedDateStr}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>Automatic Due Date (2 Weeks):</span>
                    <span style={{ color: "var(--secondary)", fontWeight: "600" }}>
                      {formatDate(new Date(getSimulatedDate().getTime() + 14 * 24 * 60 * 60 * 1000))}
                    </span>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={!checkoutData.bookId || !checkoutData.memberId}
                >
                  Confirm Check Out
                </button>
              </form>
            </div>
          </div>

          {/* Active Loans Mini Summary */}
          <div>
            <h2>Active Loans</h2>
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "400px", overflowY: "auto" }}>
              {books.filter(b => b.status === "Checked Out").length === 0 ? (
                <p style={{ textAlign: "center", padding: "2rem 0" }}>No active library loans.</p>
              ) : (
                books.filter(b => b.status === "Checked Out").map(book => {
                  const overdue = isBookOverdue(book);
                  return (
                    <div key={book.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", borderBottom: "1px solid var(--border-color)" }}>
                      <div>
                        <div style={{ fontWeight: "600", fontSize: "0.9rem" }}>{book.title}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          Borrowed by {book.borrowerName}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                        <span className={`badge ${overdue ? "badge-danger" : "badge-info"}`} style={{ fontSize: "0.65rem" }}>
                          {overdue ? "Overdue" : "On Loan"}
                        </span>
                        <span style={{ fontSize: "0.75rem", marginTop: "4px", color: overdue ? "var(--danger)" : "var(--text-muted)" }}>
                          Due: {formatDateStr(book.dueDate)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Overdue Alerts & Notifications Tab */}
      {activeTab === "notifications" && (
        <div className="grid-2">
          {/* Overdue alert center */}
          <div>
            <h2>Overdue Reminders</h2>
            <div className="card" style={{ padding: "0" }}>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Overdue Book</th>
                      <th>Borrower</th>
                      <th>Days Overdue</th>
                      <th>Alert Status</th>
                      <th style={{ width: "160px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.filter(b => isBookOverdue(b)).length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                          <Check size={32} style={{ color: "var(--success)", opacity: 0.5, marginBottom: "8px" }} /><br />
                          Great job! No books are currently overdue.
                        </td>
                      </tr>
                    ) : (
                      books.filter(b => isBookOverdue(b)).map(book => {
                        const member = members.find(m => m.id === book.borrowerId);
                        const overdueDays = getOverdueDays(book);
                        const noticeStatus = getNotificationStatus(book);
                        
                        return (
                          <tr key={book.id} style={{ borderLeft: "3px solid var(--danger)" }}>
                            <td>
                              <div style={{ fontWeight: "600" }}>{book.title}</div>
                              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                Due: {formatDateStr(book.dueDate)}
                              </div>
                            </td>
                            <td>
                              <div>{book.borrowerName}</div>
                              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                {member?.email}
                              </div>
                            </td>
                            <td style={{ color: "var(--danger)", fontWeight: "bold" }}>
                              {overdueDays} days
                            </td>
                            <td>
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <span className={`badge ${noticeStatus.reason === "pending" ? "badge-success" : "badge-warning"}`} style={{ fontSize: "0.65rem", width: "fit-content" }}>
                                  {noticeStatus.text}
                                </span>
                                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                                  {book.notificationCount} notices sent
                                </span>
                              </div>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <button 
                                className="btn btn-primary btn-sm"
                                style={{ width: "auto" }}
                                onClick={() => setActiveNoticeModal(book)}
                              >
                                <Mail size={14} /> Send Notice
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Email Transmission Logs */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ marginBottom: 0 }}>Notice Dispatch Log</h2>
              {notificationLogs.length > 0 && (
                <button className="btn btn-secondary btn-sm" onClick={clearLogs}>Clear Log</button>
              )}
            </div>
            
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "400px", overflowY: "auto" }}>
              {notificationLogs.length === 0 ? (
                <p style={{ textAlign: "center", padding: "2rem 0" }}>No email notifications sent yet.</p>
              ) : (
                notificationLogs.map(log => (
                  <div key={log.id} style={{ padding: "10px", borderBottom: "1px solid var(--border-color)", fontSize: "0.85rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "600", marginBottom: "4px" }}>
                      <span style={{ color: "var(--primary)" }}>Notice #{log.noticeNumber} Sent</span>
                      <span style={{ color: "var(--text-muted)", fontWeight: "normal" }}>{formatDateStr(log.dateStr)}</span>
                    </div>
                    <div>
                      <strong>To:</strong> {log.recipientName} ({log.recipientEmail})
                    </div>
                    <div style={{ marginTop: "2px" }}>
                      <strong>Book:</strong> "{log.bookTitle}" (Overdue {log.overdueDays} days)
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* EMAIL NOTICE MODAL CLIENT SIMULATOR */}
      {activeNoticeModal && (() => {
        const book = activeNoticeModal;
        const member = members.find(m => m.id === book.borrowerId);
        if (!member) return null;

        const overdueDays = getOverdueDays(book);
        const noticeNumber = book.notificationCount + 1;

        // Custom template logic
        const subject = `[OVERDUE NOTICE #${noticeNumber}] Return Request for "${book.title}"`;
        
        let renewalStatement = "";
        if (book.renewalCount < 2) {
          renewalStatement = `You have used ${book.renewalCount} out of 2 allowed renewals. If you need more time, you may log in to renew this book for an additional 2 weeks, or contact the librarian.`;
        } else {
          renewalStatement = `You have already used the maximum limit of 2 renewals for this book. Under our loan policy, this book cannot be renewed further and must be returned to the library immediately.`;
        }

        const body = `Dear ${member.name},

This is a formal reminder (Notice #${noticeNumber}) that the book "${book.title}" (by ${book.author}) which you checked out on ${formatDateStr(book.checkoutDate)} is overdue. 

It was due back on ${formatDateStr(book.dueDate)} and is currently ${overdueDays} days past due.

${renewalStatement}

Please return the book as soon as possible to keep the library in circulation for other club members. A follow-up notification will be dispatched every 2 weeks if the book remains unreturned.

Thank you,
Book Club Library Team
bookclub@library.local`;

        return (
          <div className="overlay">
            <div className="modal">
              <div className="modal-header">
                <h3 className="modal-title">
                  <Mail size={18} style={{ color: "var(--primary)" }} /> Send Email Reminder Simulator
                </h3>
                <button className="close-btn" onClick={() => setActiveNoticeModal(null)}>
                  <X size={20} />
                </button>
              </div>
              
              <div className="modal-body">
                <p style={{ fontSize: "0.85rem", marginBottom: "1rem" }}>
                  This screen simulates the email that will be dispatched to the member. Under the 2-week reminder policy, this notice will repeat every 14 days if the book is not returned.
                </p>
                
                <div className="email-client">
                  <div className="email-headers">
                    <div className="email-header-line">
                      <span className="email-header-label">From:</span>
                      <span className="email-header-value">bookclub@library.local</span>
                    </div>
                    <div className="email-header-line">
                      <span className="email-header-label">To:</span>
                      <span className="email-header-value">{member.name} &lt;{member.email}&gt;</span>
                    </div>
                    <div className="email-header-line">
                      <span className="email-header-label">Subject:</span>
                      <span className="email-header-value" style={{ fontWeight: "bold", color: "var(--warning)" }}>{subject}</span>
                    </div>
                  </div>
                  <div className="email-body">
                    {body}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => setActiveNoticeModal(null)}>
                  Cancel
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleSendReminder}>
                  Send Simulated Email
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
