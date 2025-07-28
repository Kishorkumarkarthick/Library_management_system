let currentUser = null;

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
}

function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (!username || !password) {
    document.getElementById("loginStatus").innerText = "Please enter credentials.";
    return;
  }

  localStorage.setItem("user", username);
  currentUser = username;
  document.getElementById("loginStatus").innerText = "Logged in as " + username;
}

function addBook() {
  const title = document.getElementById("title").value.trim();
  const author = document.getElementById("author").value.trim();
  const isbn = document.getElementById("isbn").value.trim();
  const genre = document.getElementById("genre").value;

  if (!title || !author || !isbn) {
    alert("Please fill in all fields");
    return;
  }

  const books = JSON.parse(localStorage.getItem("books") || "[]");
  books.push({ title, author, isbn, genre, available: true });
  localStorage.setItem("books", JSON.stringify(books));
  displayBooks();
}

function borrowBook(isbn) {
  if (!currentUser) {
    alert("You must login to borrow a book");
    return;
  }

  const books = JSON.parse(localStorage.getItem("books") || "[]");
  const book = books.find(b => b.isbn === isbn);
  if (!book || !book.available) return;

  book.available = false;

  let borrowed = JSON.parse(localStorage.getItem("borrowed") || "[]");
  borrowed.push({ isbn, user: currentUser, date: new Date().toLocaleDateString() });
  localStorage.setItem("borrowed", JSON.stringify(borrowed));

  localStorage.setItem("books", JSON.stringify(books));
  displayBooks();
}

function returnBook(isbn) {
  const books = JSON.parse(localStorage.getItem("books") || "[]");
  const book = books.find(b => b.isbn === isbn);
  if (!book) return;

  book.available = true;

  let borrowed = JSON.parse(localStorage.getItem("borrowed") || "[]");
  borrowed = borrowed.filter(b => b.isbn !== isbn || b.user !== currentUser);
  localStorage.setItem("borrowed", JSON.stringify(borrowed));

  localStorage.setItem("books", JSON.stringify(books));
  displayBooks();
}
function displayBooks() {
  const list = document.getElementById("bookList");
  if (!list) return;

  const books = JSON.parse(localStorage.getItem("books") || "[]");
  const search = document.getElementById("search")?.value.toLowerCase() || "";
  list.innerHTML = "";

  books.filter(b =>
    b.title.toLowerCase().includes(search) ||
    b.author.toLowerCase().includes(search) ||
    b.isbn.includes(search)
  ).forEach(book => {
    const row = document.createElement("tr");

    const actionBtn = book.available
      ? `<button onclick="borrowBook('${book.isbn}')">Borrow</button>`
      : `<button onclick="returnBook('${book.isbn}')">Return</button>`;

    row.innerHTML = `
      <td>${book.title}</td>
      <td>${book.author}</td>
      <td>${book.isbn}</td>
      <td>${book.genre}</td>
      <td>${book.available ? "Available" : "Borrowed"}</td>
      <td>${actionBtn}</td>
    `;

    list.appendChild(row);
  });

  updateStats();
}

function updateStats() {
  const stats = document.getElementById("stats");
  if (!stats) return;

  const books = JSON.parse(localStorage.getItem("books") || "[]");
  const borrowed = JSON.parse(localStorage.getItem("borrowed") || "[]");

  stats.innerHTML = `
    📘 Total Books: ${books.length}<br>
    📕 Borrowed Books: ${borrowed.length}<br>
    👤 Logged in as: ${currentUser || "Guest"}
  `;
}

window.onload = () => {
  currentUser = localStorage.getItem("user") || null;
  const statusDiv = document.getElementById("loginStatus");
  if (currentUser && statusDiv) {
    statusDiv.innerText = "Logged in as " + currentUser;
  }
  displayBooks();
};

function deleteAllBooks() {
  if (confirm("Are you sure you want to delete all books?")) {
    localStorage.removeItem("books");
    displayBooks();
    alert("All books deleted.");
  }
}

// Import books from CSV
function importCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    const lines = text.split("\n").map(line => line.trim()).filter(line => line);
    const books = [];

    for (let i = 1; i < lines.length; i++) {
      const [title, author, isbn, genre, available] = lines[i].split(",");
      if (!title || !author || !isbn || !genre) continue;

      books.push({
        title: title.trim(),
        author: author.trim(),
        isbn: isbn.trim(),
        genre: genre.trim(),
        available: (available?.trim().toLowerCase() === "yes")
      });
    }

    const existingBooks = JSON.parse(localStorage.getItem("books") || "[]");
    const allBooks = [...existingBooks, ...books];
    localStorage.setItem("books", JSON.stringify(allBooks));
    displayBooks();
    alert("Books imported successfully!");
  };

  reader.readAsText(file);
}

async function exportPDF() {
  const books = JSON.parse(localStorage.getItem("books") || "[]");
  if (books.length === 0) {
    alert("No books to export.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Library Book List", 10, 10);

  const headers = ["Title", "Author", "ISBN", "Genre", "Available"];
  const rows = books.map(b =>
    [b.title, b.author, b.isbn, b.genre, b.available ? "Yes" : "No"]
  );

  let y = 20;
  doc.setFontSize(10);
  doc.text(headers.join(" | "), 10, y);
  y += 6;

  rows.forEach(row => {
    doc.text(row.join(" | "), 10, y);
    y += 6;
    if (y > 280) { // move to new page if needed
      doc.addPage();
      y = 10;
    }
  });

  doc.save("library_books.pdf");
}
function exportCSV() {
  const books = JSON.parse(localStorage.getItem("books") || "[]");
  if (books.length === 0) {
    alert("No books to export.");
    return;
  }

  const headers = ["Title", "Author", "ISBN", "Genre", "Available"];
  const rows = books.map(book =>
    [
      book.title.replace(/,/g, ""), 
      book.author.replace(/,/g, ""), 
      book.isbn, 
      book.genre, 
      book.available ? "Yes" : "No"
    ]
  );

  const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "library_books.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
