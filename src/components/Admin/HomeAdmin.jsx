import React, { useState, useEffect } from "react";
import { Carousel, Container, Row, Col, Form, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link, useNavigate } from "react-router-dom";
import { SignOut } from "../../api/apiAuth";
import { apiHomeAdmin, apiUpdateStatus, apiDeletePeminjaman } from "../../api/Admin/apiHomeAdmin";
import { createPengembalian } from "../../api/Admin/apiHomeAdmin";

const HomeAdmin = () => {
  const [userIdSearch, setUserIdSearch] = useState("");
  const [bookSearch, setBookSearch] = useState("");
  const [originalPeminjamanData, setOriginalPeminjamanData] = useState([]);
  const [peminjamanData, setPeminjamanData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPeminjamanData = async () => {
      try {
        const data = await apiHomeAdmin();
        setOriginalPeminjamanData(data);
        setPeminjamanData(data);
        setLoading(false);
      } catch (err) {
        setError(err.message || "Failed to fetch data.");
        setLoading(false);
      }
    };

    fetchPeminjamanData();
  }, []);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/src/components/Admin/HomeAdmin.css';
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  useEffect(() => {
    const filteredData = originalPeminjamanData.filter((item) => {
      const matchesUserId = userIdSearch
        ? item.id_user.toString().toLowerCase().includes(userIdSearch.toLowerCase())
        : true;
      const matchesBookId = bookSearch
        ? item.id_buku.toString().toLowerCase().includes(bookSearch.toLowerCase())
        : true;

      return matchesUserId && matchesBookId;
    });

    setPeminjamanData(filteredData);
  }, [userIdSearch, bookSearch, originalPeminjamanData]);

  const handleLogout = async () => {
    try {
      const result = await SignOut();

      if (result.success) {
        console.log("Logout successful");
        sessionStorage.clear();
        navigate("/");
      } else {
        console.error("Logout failed:", result.error);
        alert("Failed to log out. Please try again.");
      }
    } catch (error) {
      console.error("Unexpected error during logout:", error);
      alert("Unexpected error during logout. Please try again.");
    }
  };

  const handleAccept = async (id, id_user, id_buku) => {
    try {
      const updatedData = await apiUpdateStatus(id, "borrowed");
      console.log(`Book request with ID ${id} accepted.`);
      setPeminjamanData((prevData) =>
        prevData.map((item) =>
          item.id_pinjam === id ? { ...item, status: "borrowed" } : item
        )
      );

      // Call createPengembalian API
      const pengembalianData = await createPengembalian(id, id_user, 0); // Example jml_denda as 0 initially
      console.log("Pengembalian record created successfully:", pengembalianData);
    } catch (error) {
      console.error("Failed to accept request or create pengembalian:", error);
      alert("Failed to accept request or create pengembalian. Please try again.");
    }
  };

  const handleDecline = async (id) => {
    try {
      await apiDeletePeminjaman(id);
      console.log(`Book request with ID ${id} deleted.`);
  

      setPeminjamanData((prevData) =>
        prevData.filter((item) => item.id_pinjam !== id)
      );
    } catch (error) {
      console.error("Failed to delete request:", error);
      alert("Failed to decline (delete) request. Please try again.");
    }
  };  

  return (
    <div className="home-container">
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
        <nav className="nav-links">
          <Link to="/HomeAdmin" className="nav-link-active">
            Home
          </Link>
          <Link to="/BookAdmin" className="nav-link">
            Books
          </Link>
          <Link to="/returning" className="nav-link">
            Returning
          </Link>
          <button className="btn btn-logout" onClick={handleLogout}>
            Log Out
          </button>
        </nav>
      </header>

      <section className="carousel-section position-relative">
        <div
          className="search-overlay position-absolute start-50 translate-middle w-100"
          style={{
            top: "80%",
            zIndex: 10,
          }}
        >
          <Container>
            <Row className="justify-content-center text-center gy-4">
              <Col md={5} lg={5} className="mb-3">
                <h5 className="mb-3 text-white"><strong>Search User ID</strong></h5>
                <div className="custom-input-group">
                  <Form.Control
                    type="text"
                    placeholder="Enter User ID..."
                    value={userIdSearch}
                    onChange={(e) => setUserIdSearch(e.target.value)}
                  />
                </div>
              </Col>

              <Col md={1} className="d-none d-md-block"></Col>

              <Col md={5} lg={5} className="mb-3">
                <h5 className="mb-3 text-white"><strong>Search Book</strong></h5>
                <div className="custom-input-group">
                  <Form.Control
                    type="text"
                    placeholder="Search for books here..."
                    value={bookSearch}
                    onChange={(e) => setBookSearch(e.target.value)}
                  />
                </div>
              </Col>
            </Row>
          </Container>
        </div>

        <Carousel interval={3000} fade wrap>
          <Carousel.Item>
            <div className="carousel-overlay">
              <img
                className="carousel-image"
                src="/src/assets/images/carousel/bg-image1.jpg"
                alt="Slide 1"
              />
            </div>
          </Carousel.Item>

          <Carousel.Item>
            <div className="carousel-overlay">
              <img
                className="carousel-image"
                src="/src/assets/images/carousel/bg-image2.jpg"
                alt="Slide 2"
              />
            </div>
          </Carousel.Item>

          <Carousel.Item>
            <div className="carousel-overlay">
              <img
                className="carousel-image"
                src="/src/assets/images/carousel/bg-image3.jpg"
                alt="Slide 3"
              />
            </div>
          </Carousel.Item>
        </Carousel>

        <div className="carousel-caption">
          <h2>Welcome Back Admin 😊</h2>
          <p>Keep up the good work!</p>
        </div>
      </section>

      <section className="peminjaman-section">
        <Container>
          <h3 className="text-center my-4 section-title">Peminjaman Data</h3>
          {loading && <p>Loading data...</p>}
          {error && <p className="text-danger">Error: {error}</p>}
          {!loading && !error && (
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>#</th>
                  <th>User ID</th>
                  <th>Book ID</th>
                  <th>Date Borrowed</th>
                  <th>Date Returned</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
                  <tbody>
                    {peminjamanData.map((item, index) => (
                      <tr key={item.id_pinjam}>
                        <td>{index + 1}</td>
                        <td>{item.id_user}</td>
                        <td>{item.id_buku}</td>
                        <td>{item.tgl_pinjam || "Not yet borrowed"}</td>
                        <td>{item.tgl_kembali || "Not returned"}</td>
                        <td>{item.status}</td>
                        <td>
                          {item.status === "pending" ? (
                            <>
                              <Button
                                variant="success"
                                className="me-2"
                                onClick={() => handleAccept(item.id_pinjam, item.id_user, item.id_buku)}
                              >
                                Accept
                              </Button>
                              <Button
                                variant="danger"
                                onClick={() => handleDecline(item.id_pinjam)}
                              >
                                Decline
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="success" disabled>
                                Accept
                              </Button>
                              <Button variant="danger" disabled>
                                Decline
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
            </table>
          )}
        </Container>
    </section>
    </div>
  );
};

export default HomeAdmin;
