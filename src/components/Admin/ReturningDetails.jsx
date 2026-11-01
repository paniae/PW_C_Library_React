import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Container, Table, Button, Form } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { apiGetPengembalianByUser, apiDeletePengembalian } from "../../api/Admin/apiReturningDetails";


const ReturningDetails = () => {
  const { userId } = useParams();
  const [pengembalianData, setPengembalianData] = useState([]);
  const [originalData, setOriginalData] = useState([]); // Store original data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); // Search state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false); // Confirm dialog state
  const [selectedAction, setSelectedAction] = useState(null); // To know which action was triggered
  const [selectedItem, setSelectedItem] = useState(null); // Track the selected item
  const navigate = useNavigate();
  const baseURL = "http://127.0.0.1:8000";

  useEffect(() => {
    const fetchPengembalianData = async () => {
      try {
        const data = await apiGetPengembalianByUser(userId);
        setPengembalianData(data);
        setOriginalData(data); // Keep original data for filtering
        setLoading(false);
      } catch (err) {
        setError(err.message || "Failed to fetch data.");
        setLoading(false);
      }
    };

    fetchPengembalianData();
  }, [userId]);

  useEffect(() => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/src/components/Admin/ReturningDetails.css';
      document.head.appendChild(link);
      
      return () => {
        document.head.removeChild(link);
      };
    }, []);

  useEffect(() => {
    // Filter by book title
    if (!searchTerm.trim()) {
      setPengembalianData(originalData);
      return;
    }

    const filteredData = originalData.filter((item) =>
      (item.peminjaman?.buku?.judul || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

    setPengembalianData(filteredData);
  }, [searchTerm, originalData]);

  // Open confirm dialog
  const handleAction = (action, item) => {
    setShowConfirmDialog(true);
    setSelectedAction(action);
    setSelectedItem(item);
  };

  // Confirm action handler
  const handleConfirm = async () => {
    setShowConfirmDialog(false);
    try {
      if (selectedAction === "payment") {
        setPengembalianData((prevData) =>
          prevData.map((data) =>
            data.id_pengembalian === selectedItem.id_pengembalian
              ? { ...data, calculated_denda: 0 }
              : data
          )
        );
        toast.success("Fine has been successfully cleared!");
      } else if (selectedAction === "confirm") {
        // Call API to delete pengembalian and increment stock
        await apiDeletePengembalian(selectedItem.id_pengembalian);
  
        // Update UI
        setPengembalianData((prevData) =>
          prevData.filter(
            (data) => data.id_pengembalian !== selectedItem.id_pengembalian
          )
        );
  
        toast.success("Book return has been successfully confirmed!");
      }
    } catch (err) {
      toast.error("Failed to perform action. Please try again.");
    }
  };
  
  const handleCancel = () => {
    setShowConfirmDialog(false);
    setSelectedAction(null);
    setSelectedItem(null);
  };

  return (
    <div className="home-container">
      {/* App Bar */}
      <header className="app-bar">
        <div className="logo">
          <a href="/" className="logo-link">
            <img
              src="/src/assets/images/logo-image.png"
              alt="Logo"
              className="logo-image"
            />
            <span className="logo-text">Atma Library</span>
          </a>
        </div>

        {/* Search Input Moved Here */}
        <Form.Control
          type="text"
          placeholder="Search by book title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input mx-3"
          style={{ maxWidth: "300px" }}
        />

        <nav className="nav-links">
          <Link to="/HomeAdmin" className="nav-link">
            Home
          </Link>
          <Link to="/BookAdmin" className="nav-link">
            Books
          </Link>
          <Link to="/returning" className="nav-link">
            Returning
          </Link>
        </nav>
      </header>

      {/* Table Section */}
      <Container className="mt-5 pt-5">
        {loading && <p>Loading data...</p>}
        {error && <p className="text-danger">Error: {error}</p>}
        {!loading && !error && (
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>#</th>
                <th>Book Poster</th>
                <th>Book Title</th>
                <th>Date Borrowed</th>
                <th>Date Returned</th>
                <th>Overdue (days)</th>
                <th>Fine</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
  {pengembalianData.map((item, index) => {
    const peminjaman = item.peminjaman || {};
    const buku = peminjaman.buku || {};
    const denda = item.calculated_denda;

    return (
      <tr key={item.id_pengembalian}>
        <td>{index + 1}</td>
        <td>
          <img
            src={`${baseURL}/storage/${buku.book_poster}`}
            alt="Book Poster"
            style={{ width: "80px", height: "120px", objectFit: "cover" }}
          />
        </td>
        <td>{buku.judul || "Unknown Title"}</td>
        <td>{peminjaman.tgl_pinjam || "N/A"}</td>
        <td>{peminjaman.tgl_kembali || "Not yet returned"}</td>
        <td>{denda > 0 ? denda / 50000 : 0}</td>
        <td>{"Rp " + denda}</td>
        <td>
          {denda > 0 ? (
            <Button
              variant="danger"
              onClick={() => handleAction("payment", item)}
            >
              Payment
            </Button>
          ) : (
            <Button
              variant="success"
              onClick={() => handleAction("confirm", item)}
            >
              Confirm
            </Button>
          )}
        </td>
      </tr>
    );
  })}
</tbody>
          </Table>
        )}
      </Container>

      {/* Confirm Dialog */}
      {showConfirmDialog && (
        <div className="confirm-dialog">
            <div className="confirm-dialog-content">
            <p>
                {selectedAction === "payment"
                ? 'Confirm payment?'
                : `Confirm returning the book "${selectedItem?.peminjaman?.buku?.judul || "this book"}"?`}
            </p>
            <div className="button-container">
                <Button className="button-leave" variant="danger" onClick={handleConfirm}>
                Yes
                </Button>
                <Button className="button-cancel" variant="secondary" onClick={handleCancel}>
                Cancel
                </Button>
            </div>
            </div>
        </div>
        )}
        {/* Toast Container */}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default ReturningDetails;
