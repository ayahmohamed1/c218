import React, { useState, useEffect, useRef } from 'react';
import { INVITATION_DATA } from './invitationData';
import { db } from './firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

export default function App() {
  const [isOpened, setIsOpened] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [countdown, setCountdown] = useState({ days: '00', hours: '00', minutes: '00', seconds: '00' });

  // RSVP Form State
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpMessage, setRsvpMessage] = useState('');
  const [rsvpAttendance, setRsvpAttendance] = useState('attending');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Real-time Guestbook Messages State
  const [liveMessages, setLiveMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);

  // Subscribe to real-time RSVP messages from Firebase
  useEffect(() => {
    try {
      const q = query(collection(db, 'rsvps'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs = [];
        snapshot.forEach((doc) => {
          msgs.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setLiveMessages(msgs);
        setMessagesLoading(false);
      }, (error) => {
        console.error('Error fetching RSVPs from Firestore:', error);
        setMessagesLoading(false);
      });
      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up RSVP listener:', err);
      setMessagesLoading(false);
    }
  }, []);

  const handleRsvpSubmit = async (e) => {
    e.preventDefault();
    if (!rsvpName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await addDoc(collection(db, 'rsvps'), {
        name: rsvpName.trim(),
        message: rsvpMessage.trim(),
        attendance: rsvpAttendance,
        createdAt: serverTimestamp(),
        timestamp: Date.now()
      });
      setRsvpSubmitted(true);
      setRsvpName('');
      setRsvpMessage('');
    } catch (error) {
      console.error('Error saving RSVP to Firestore:', error);
      if (error?.code === 'permission-denied') {
        setSubmitError('تنبيه: يجب تعديل قواعد فايربيس (Firestore Rules) لتفعيل القراءة والكتابة: allow read, write: if true;');
      } else {
        setSubmitError('تعذر حفظ الرسالة، يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatMessageTime = (msg) => {
    if (msg.createdAt && msg.createdAt.toDate) {
      return msg.createdAt.toDate().toLocaleDateString('ar-EG', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    if (msg.timestamp) {
      return new Date(msg.timestamp).toLocaleDateString('ar-EG', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return 'الآن';
  };

  const audioRef = useRef(null);

  // Countdown timer calculation
  useEffect(() => {
    function calcTime() {
      const target = new Date(INVITATION_DATA.schedule.targetDateTime).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setCountdown({ days: '00', hours: '00', minutes: '00', seconds: '00' });
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({
        days: String(d).padStart(2, '0'),
        hours: String(h).padStart(2, '0'),
        minutes: String(m).padStart(2, '0'),
        seconds: String(s).padStart(2, '0')
      });
    }

    calcTime();
    const interval = setInterval(calcTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle music toggle
  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn('Audio play prevented', err);
      });
    }
  };

  // Open the invitation and start the background music.
  const handleOpenEnvelope = () => {
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => console.warn(err));
    }

    setIsOpened(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="royal-app" dir="rtl">
      {/* Background Audio */}
      <audio ref={audioRef} src={INVITATION_DATA.audioTrack} loop preload="auto" />

      {/* Floating Music Button (Matching screenshot) */}
      <button 
        className={`floating-music-btn ${isPlaying ? 'playing' : ''}`}
        onClick={toggleMusic}
        title={isPlaying ? "إيقاف الموسيقى" : "تشغيل الموسيقى"}
      >
        <div className="music-bars">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      {/* ====================================================== */}
      {/* SCREEN 1: NEW ENVELOPE (MATCHING USER REFERENCE IMAGE) */}
      {/* ====================================================== */}
      <section className={`envelope-stage ${isOpened ? 'opened' : ''}`}>
        <div className="envelope-wrapper">
          <p className="envelope-top-subtitle">{INVITATION_DATA.envelopeHeader}</p>
          
          {/* Cursive Italic English Script Names */}
          <h1 className="envelope-names-script">
            {INVITATION_DATA.scriptNames}
          </h1>

          <div className="envelope-image-box" onClick={handleOpenEnvelope}>
            <img src="/envelope.png" alt="Engagement invitation envelope" className="envelope-img" />
          </div>

          <button type="button" className="click-to-open-text" onClick={handleOpenEnvelope}>
            Click <span className="underlined">here</span> to open
          </button>
        </div>
      </section>

      {/* ====================================================== */}
      {/* SCREEN 2: THE ROYAL INVITATION CARD (FULLSCREEN)       */}
      {/* ====================================================== */}
      <main className="invitation-fullscreen-container">
        <article className="invitation-sheet">

          <div className="side-lace-border side-lace-left" aria-hidden="true"></div>
          <div className="side-lace-border side-lace-right" aria-hidden="true"></div>

          <div className="header-drape-left" aria-hidden="true">
            <img src="/curtain.png" alt="" />
          </div>

          <div className="header-bouquet-right" aria-hidden="true">
            <img src="/bouquet.png" alt="" />
          </div>

          <div className="sheet-inner">


            {/* 2. INVITATION WELCOME MESSAGE */}
            <p className="invitation-intro-msg invitation-english-intro">{INVITATION_DATA.welcomeMessage}</p>

            {/* CHIC DIVIDER */}
            <div className="chic-divider">
              <span className="divider-line"></span>
              <span className="divider-diamond"></span>
              <span className="divider-line"></span>
            </div>

            {/* 3. GROOM & BRIDE NAMES (BURGUNDY SCRIPT TYPOGRAPHY) */}
            <section className="names-container">
              <div className="person-block">
                <h2 className="person-title-script">{INVITATION_DATA.groom.name}</h2>
                <span className="person-role-tag">{INVITATION_DATA.groom.subtitle}</span>
              </div>

              <div className="ampersand-sign">&amp;</div>

              <div className="person-block">
                <h2 className="person-title-script">{INVITATION_DATA.bride.name}</h2>
                <span className="person-role-tag">{INVITATION_DATA.bride.subtitle}</span>
              </div>
            </section>

            {/* CHIC DIVIDER */}
            <div className="chic-divider">
              <span className="divider-line"></span>
              <span className="divider-diamond"></span>
              <span className="divider-line"></span>
            </div>

            {/* 5. EVENT TIMING & DATE (MATCHING SCREENSHOT RHYTHM) */}
            <section className="event-timing-section">
              <p className="timing-intro-label">{INVITATION_DATA.schedule.headingEn}</p>
              <h3 className="timing-big-hour" dir="ltr" style={{ direction: 'ltr', display: 'inline-block' }}>
                {INVITATION_DATA.schedule.timeDisplay}
              </h3>

              <div className="timing-date-row" dir="ltr">
                <span>{INVITATION_DATA.schedule.dateDayName}</span>
                <span>|</span>
                <span className="date-day-num">{INVITATION_DATA.schedule.dateDayNumber}</span>
                <span>|</span>
                <span>{INVITATION_DATA.schedule.dateMonthYear}</span>
              </div>

            </section>

            {/* CHIC DIVIDER */}
            <div className="chic-divider">
              <span className="divider-line"></span>
              <span className="divider-diamond"></span>
              <span className="divider-line"></span>
            </div>

            {/* 6. COUNTDOWN TIMER (FROM LEFT TO RIGHT: DAYS, HOURS, MINUTES, SECONDS) */}
            <section className="countdown-container-elegant" dir="ltr">
              <h4 className="countdown-title-tag">— COUNTDOWN —</h4>
              <div className="countdown-grid-four" dir="ltr">
                <div className="countdown-unit-col">
                  <span className="unit-number-serif">{countdown.days}</span>
                  <span className="unit-label-caps">DAYS</span>
                </div>
                <div className="countdown-unit-col">
                  <span className="unit-number-serif">{countdown.hours}</span>
                  <span className="unit-label-caps">HOURS</span>
                </div>
                <div className="countdown-unit-col">
                  <span className="unit-number-serif">{countdown.minutes}</span>
                  <span className="unit-label-caps">MINUTES</span>
                </div>
                <div className="countdown-unit-col">
                  <span className="unit-number-serif">{countdown.seconds}</span>
                  <span className="unit-label-caps">SECONDS</span>
                </div>
              </div>
            </section>

            {/* CHIC DIVIDER */}
            <div className="chic-divider">
              <span className="divider-line"></span>
              <span className="divider-diamond"></span>
              <span className="divider-line"></span>
            </div>

            {/* 7. LOCATION & GOOGLE MAPS */}
            <section className="location-elegant-section">
              <h4 className="location-title-tag">{INVITATION_DATA.location.title}</h4>
              <h3 className="venue-name-bold">{INVITATION_DATA.location.venueName}</h3>

              <a 
                href={INVITATION_DATA.location.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="view-map-link-btn"
              >
                <span>OPEN IN GOOGLE MAPS</span>
              </a>
            </section>

            {/* CHIC DIVIDER */}
            <div className="chic-divider">
              <span className="divider-line"></span>
              <span className="divider-diamond"></span>
              <span className="divider-line"></span>
            </div>

            {/* 9. RSVP SECTION (NAME INPUT & MESSAGE/WISHES) */}
            <section className="rsvp-section">
              <h4 className="rsvp-title">{INVITATION_DATA.rsvp?.title || "RSVP"}</h4>
              <p className="rsvp-subtitle">{INVITATION_DATA.rsvp?.subtitle || "PLEASE CONFIRM YOUR ATTENDANCE"}</p>

              <div className="rsvp-card-box">
                {rsvpSubmitted ? (
                  <div className="rsvp-success-card">
                    <span className="rsvp-success-icon">💌</span>
                    <h5 className="rsvp-success-heading">
                      {INVITATION_DATA.rsvp?.successHeading || "THANK YOU!"}
                    </h5>
                    <p className="rsvp-success-desc">
                      {INVITATION_DATA.rsvp?.successMessage || "Your message has been received with love for Seif & Habiba ❤️"}
                    </p>
                    <button 
                      type="button" 
                      className="rsvp-send-another-btn"
                      onClick={() => setRsvpSubmitted(false)}
                    >
                      إرسال رسالة أو تأكيد آخر ✍️
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleRsvpSubmit}>
                    {/* Attendance Confirmation Toggle */}
                    <div className="rsvp-attendance-row">
                      <button
                        type="button"
                        className={`attendance-chip ${rsvpAttendance === 'attending' ? 'active' : ''}`}
                        onClick={() => setRsvpAttendance('attending')}
                      >
                        ✓ سأحضر بكل سرور
                      </button>
                      <button
                        type="button"
                        className={`attendance-chip ${rsvpAttendance === 'apologize' ? 'active' : ''}`}
                        onClick={() => setRsvpAttendance('apologize')}
                      >
                        ✕ أعتذر عن الحضور
                      </button>
                    </div>

                    {/* Name Input */}
                    <div className="rsvp-form-group">
                      <input 
                        id="rsvp-name"
                        type="text" 
                        className="rsvp-input"
                        placeholder={INVITATION_DATA.rsvp?.namePlaceholder || "Name / الاسم"}
                        value={rsvpName}
                        onChange={(e) => setRsvpName(e.target.value)}
                        required
                        disabled={isSubmitting}
                        dir="auto"
                      />
                    </div>

                    {/* Message for Couple */}
                    <div className="rsvp-form-group">
                      <textarea 
                        id="rsvp-message"
                        className="rsvp-textarea"
                        placeholder={INVITATION_DATA.rsvp?.messagePlaceholder || "Leave a message for Seif & Habiba..."}
                        value={rsvpMessage}
                        onChange={(e) => setRsvpMessage(e.target.value)}
                        rows="3"
                        disabled={isSubmitting}
                        dir="auto"
                      ></textarea>
                    </div>

                    {submitError && (
                      <div className="rsvp-error-banner">
                        <span>⚠️</span> {submitError}
                      </div>
                    )}

                    {/* Submit Button */}
                    <button 
                      type="submit" 
                      className={`rsvp-submit-btn ${isSubmitting ? 'submitting' : ''}`}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "SENDING..." : (INVITATION_DATA.rsvp?.submitText || "SEND RSVP")}
                    </button>
                  </form>
                )}
              </div>

              {/* REAL-TIME LIVE GUESTBOOK & WISHES BOARD */}
              <div className="rsvp-messages-board">
                <div className="messages-board-header">
                  <div className="board-title-group">
                    <span className="live-pulse-dot" title="مباشر"></span>
                    <h5 className="messages-board-title">GUESTBOOK &amp; WISHES</h5>
                  </div>
                  <span className="messages-count-badge">
                    {liveMessages.length} {liveMessages.length === 1 ? 'تهنئة' : 'تهاني'}
                  </span>
                </div>

                <div className="messages-list-scroll">
                  {messagesLoading ? (
                    <div className="messages-loading">
                      <span className="loading-spinner"></span>
                      <span>جاري تحميل التهاني والرسائل...</span>
                    </div>
                  ) : liveMessages.length === 0 ? (
                    <div className="messages-empty">
                      <span>✨</span>
                      <p>كن أول من يشارك العروسين فرحتهما ويترك تهنئة!</p>
                    </div>
                  ) : (
                    liveMessages.map((item) => (
                      <div key={item.id} className="message-item-card">
                        <div className="message-item-top">
                          <div className="message-sender-info">
                            <span className="sender-avatar">
                              {item.name ? item.name.trim().charAt(0).toUpperCase() : '♥'}
                            </span>
                            <strong className="sender-name">{item.name}</strong>
                          </div>
                          <div className="message-meta-right">
                            {item.attendance === 'attending' && (
                              <span className="attendance-tag attending">حاضر بإذن الله</span>
                            )}
                            {item.attendance === 'apologize' && (
                              <span className="attendance-tag apologize">يعتذر عن الحضور</span>
                            )}
                            <span className="message-time">{formatMessageTime(item)}</span>
                          </div>
                        </div>
                        {item.message && (
                          <p className="message-content" dir="auto">
                            {item.message}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>



            {/* RE-OPEN ENVELOPE BUTTON (IN ENGLISH AS REQUESTED) */}
            <button 
              className="reopen-envelope-chip" 
              onClick={() => {
                setIsOpened(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <span>↩ RE-OPEN ENVELOPE</span>
            </button>

          </div>
        </article>
      </main>
    </div>
  );
}
