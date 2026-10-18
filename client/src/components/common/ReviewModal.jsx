import { useState } from 'react';
import { reviewApi } from '../../api/services';

/**
 * Modal for submitting a star-rating review after a completed session.
 * Props:
 *  - isOpen       {boolean}
 *  - onClose      {() => void}
 *  - sessionId    {string}
 *  - revieweeId   {string}
 *  - revieweeName {string}
 *  - onSuccess    {(review) => void}
 */
const ReviewModal = ({ isOpen, onClose, sessionId, revieweeId, revieweeName, onSuccess }) => {
  const [rating,    setRating]    = useState(0);
  const [hovered,   setHovered]   = useState(0);
  const [comment,   setComment]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { setError('Please select a star rating'); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await reviewApi.create({ sessionId, revieweeId, rating, comment });
      setSubmitted(true);
      onSuccess?.(res.data.review);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRating(0); setHovered(0); setComment('');
    setError(null); setSubmitted(false);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>
      <div
        className="card"
        style={{
          maxWidth: '480px', width: '100%',
          background: 'var(--bg-card)',
          animation: 'fadeInUp 0.25s ease',
        }}
      >
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌟</div>
            <h3 style={{ marginBottom: '0.5rem' }}>Review Submitted!</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Thanks for rating {revieweeName}. Your feedback helps build trust in the community.
            </p>
            <button className="btn btn-primary" onClick={handleClose}>Close</button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ marginBottom: '0.25rem' }}>⭐ Leave a Review</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  How was your session with <strong style={{ color: 'var(--text-primary)' }}>{revieweeName}</strong>?
                </p>
              </div>
              <button
                onClick={handleClose}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1, padding: '0.2rem' }}
                aria-label="Close"
              >×</button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Star Rating */}
              <div className="form-group">
                <label className="form-label">Rating *</label>
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      id={`star-${star}`}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHovered(star)}
                      onMouseLeave={() => setHovered(0)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '2rem',
                        color: star <= (hovered || rating) ? 'var(--warning-400)' : 'var(--bg-card-2)',
                        transition: 'color 0.15s, transform 0.15s',
                        transform: star <= (hovered || rating) ? 'scale(1.15)' : 'scale(1)',
                        filter: star <= (hovered || rating) ? 'drop-shadow(0 0 6px rgba(251,191,36,0.5))' : 'none',
                        padding: '0.1rem',
                      }}
                      aria-label={`${star} star${star > 1 ? 's' : ''}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    {['', '😐 Poor', '🙁 Fair', '😊 Good', '😄 Great', '🤩 Excellent!'][rating]}
                  </div>
                )}
              </div>

              {/* Comment */}
              <div className="form-group">
                <label className="form-label" htmlFor="review-comment">Comment <span style={{ opacity: 0.6 }}>(optional)</span></label>
                <textarea
                  id="review-comment"
                  className="form-textarea"
                  placeholder="Share what you learned, how they taught, or any feedback..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={1000}
                  rows={3}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>{comment.length}/1000</div>
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={handleClose} disabled={loading}>
                  Cancel
                </button>
                <button
                  id="submit-review-btn"
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || rating === 0}
                >
                  {loading ? <><span className="spinner spinner-sm" /> Submitting...</> : '⭐ Submit Review'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ReviewModal;
