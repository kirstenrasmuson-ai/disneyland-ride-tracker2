import { useState, useEffect, useCallback, useMemo } from "react";

const PARKS = {
  disneyland: {
    name: "Disneyland Park", icon: "🏰",
    lands: {
      "Main Street": ["Disneyland Railroad", "Main Street Vehicles"],
      "Adventureland": ["Indiana Jones Adventure", "Jungle Cruise"],
      "Bayou Country": ["Davy Crockett's Explorer Canoes", "Many Adventures of Winnie the Pooh", "Tiana's Bayou Adventure"],
      "Fantasyland": ["Alice in Wonderland", "Casey Jr. Circus Train", "Dumbo", "it's a small world", "King Arthur Carrousel", "Mad Tea Party", "Matterhorn", "Mr Toad's Wild Ride", "Peter Pan's Flight", "Pinocchio's Daring Journey", "Snow White's Enchanted Wish", "Storybook Land Canal Boats"],
      "Frontierland": ["Big Thunder Mountain Railroad", "Mark Twain River Boat", "Sailing Ship Columbia"],
      "Galaxy's Edge": ["Millennium Falcon Smugglers Run", "Star Wars: Rise of the Resistance"],
      "Mickey's ToonTown": ["Chip n Dale's Gadget Coaster", "Mickey & Minnie's Runaway Railway", "Roger Rabbit's Cartoon Spin"],
      "New Orleans Square": ["Haunted Mansion", "Pirates of the Caribbean"],
      "Tomorrowland": ["Astro Orbitor", "Autopia", "Buzz Lightyear", "Disneyland Monorail", "Finding Nemo", "Space Mountain", "Star Tours"],
    },
  },
  dca: {
    name: "Disney California Adventure", icon: "🎡",
    lands: {
      "Avengers Campus": ["Guardians", "Web Slingers"],
      "Cars Land": ["Luigi's Rollickin' Roadsters", "Radiator Springs Racers", "Mater's Junkyard Jamboree"],
      "Grizzly Peak": ["Soarin", "Grizzly River Run"],
      "Paradise Gardens": ["Goofy's Sky School", "Golden Zephyr", "Jumpin' Jellyfish", "Silly Symphony Swings", "Little Mermaid"],
      "Pixar Pier": ["Inside Out Emotional Whirlwind", "Pixar Pal-A-Round – Non-Swinging", "Toy Story Midway Mania!", "Jessie's Critter Carousel", "Incredicoaster"],
      "Hollywood Land": ["Monsters, Inc. Mike & Sulley to the Rescue!"],
    },
  },
};

const LIGHTNING_LANE_RIDES = new Set([
  "disneyland-Indiana Jones Adventure", "disneyland-Tiana's Bayou Adventure", "disneyland-it's a small world",
  "disneyland-Matterhorn", "disneyland-Big Thunder Mountain Railroad", "disneyland-Millennium Falcon Smugglers Run",
  "disneyland-Mickey & Minnie's Runaway Railway", "disneyland-Roger Rabbit's Cartoon Spin", "disneyland-Space Mountain",
  "disneyland-Buzz Lightyear", "disneyland-Autopia", "disneyland-Star Tours", "disneyland-Haunted Mansion",
  "disneyland-Star Wars: Rise of the Resistance",
  "dca-Guardians", "dca-Web Slingers", "dca-Incredicoaster", "dca-Toy Story Midway Mania!",
  "dca-Soarin", "dca-Grizzly River Run", "dca-Goofy's Sky School",
  "dca-Radiator Springs Racers",
  "dca-Little Mermaid",
  "dca-Monsters, Inc. Mike & Sulley to the Rescue!",
]);

const LAND_COLORS = {
  "Main Street": "#8e8e93", "Adventureland": "#16a34a", "Bayou Country": "#059669",
  "Fantasyland": "#a855f7", "Frontierland": "#d97706", "Galaxy's Edge": "#1d4ed8",
  "Mickey's ToonTown": "#ec4899", "New Orleans Square": "#7c3aed", "Tomorrowland": "#0ea5e9",
  "Avengers Campus": "#dc2626", "Cars Land": "#ea580c", "Grizzly Peak": "#65a30d",
  "Paradise Gardens": "#0d9488", "Pixar Pier": "#2563eb", "Hollywood Land": "#6366f1",
};

function getAllRides() {
  const rides = [];
  Object.entries(PARKS).forEach(([pk, park]) => {
    Object.entries(park.lands).forEach(([land, list]) => {
      list.forEach(ride => rides.push({ id: `${pk}-${ride}`, name: ride, land, park: pk, parkName: park.name }));
    });
  });
  return rides;
}
const ALL_RIDES = getAllRides();

function fmtTime(d) { return d ? new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) : "--:--"; }
function fmtDur(s, e) { if (!s || !e) return "--"; const m = Math.round((new Date(e) - new Date(s)) / 60000); return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`; }
function fmtSecs(s) { return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; }
function now() { return new Date().toISOString(); }

function Confetti({ active }) {
  if (!active) return null;
  return <>{Array.from({ length: 30 }, (_, i) => <div key={i} style={{ position: "fixed", left: `${Math.random() * 100}%`, top: -10, width: 6 + Math.random() * 6, height: 6 + Math.random() * 6, backgroundColor: ["#ff3b30", "#ff9500", "#34c759", "#007aff", "#af52de", "#ff2d55"][i % 6], borderRadius: Math.random() > 0.5 ? "50%" : "2px", animation: `fall ${2 + Math.random()}s ease-in ${Math.random() * 0.5}s forwards`, zIndex: 9999, pointerEvents: "none" }} />)}</>;
}
export default function DisneyRideTracker() {
  const [activePark, setActivePark] = useState("disneyland");
  const [rideLog, setRideLog] = useState({});
  const [activeRide, setActiveRide] = useState(null);
  const [activeStart, setActiveStart] = useState(null);
  const [view, setView] = useState("tracker");
  const [confetti, setConfetti] = useState(false);
  const [openLand, setOpenLand] = useState(null);
  const [tick, setTick] = useState(0);
  const [dayStart, setDayStart] = useState(null);
  const [dayEnd, setDayEnd] = useState(null);
  const [dayTick, setDayTick] = useState(0);
  const [closed, setClosed] = useState(new Set());
  const [history, setHistory] = useState([]);
  const [personalBests, setPersonalBests] = useState({});
  const [confirmReset, setConfirmReset] = useState(false);
  const [expandedDay, setExpandedDay] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [waitTimes, setWaitTimes] = useState({});
  const [waitTimesUpdated, setWaitTimesUpdated] = useState(null);
  const [waitTimesLoading, setWaitTimesLoading] = useState(false);
  const [waitTimesError, setWaitTimesError] = useState(null);

  const fetchWaitTimes = useCallback(async () => {
    setWaitTimesLoading(true);
    setWaitTimesError(null);
    const newTimes = {};
    try {
      for (const [parkKey, parkData] of Object.entries(PARKS)) {
        const parkId = parkKey === "disneyland" ? 16 : 17;
        const res = await fetch(`/api/wait-times?park=${parkId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data?.lands) continue;
        const allApiRides = [...(data.lands || []).flatMap(l => l.rides), ...(data.rides || [])];
        Object.entries(parkData.lands).forEach(([land, rides]) => {
          rides.forEach(rideName => {
            const rideId = `${parkKey}-${rideName}`;
            const lower = rideName.toLowerCase();
            let match = allApiRides.find(r => r.name === rideName);
            if (!match) match = allApiRides.find(r => r.name.toLowerCase().includes(lower) || lower.includes(r.name.toLowerCase()));
            if (!match) {
              const words = lower.split(/\s+/).filter(w => w.length > 3);
              if (words.length > 0) match = allApiRides.find(r => words.filter(w => r.name.toLowerCase().includes(w)).length >= Math.max(1, words.length - 1));
            }
            if (match) newTimes[rideId] = { wait: match.wait_time, isOpen: match.is_open };
          });
        });
      }
      if (Object.keys(newTimes).length > 0) {
        setWaitTimes(newTimes);
        setWaitTimesUpdated(new Date());
      } else {
        setWaitTimesError("No ride data returned");
      }
    } catch (err) {
      setWaitTimesError(err.message || "Failed to load");
    }
    setWaitTimesLoading(false);
  }, []);

  useEffect(() => {
    fetchWaitTimes();
    const interval = setInterval(fetchWaitTimes, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWaitTimes]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("challenge-data");
      if (raw) {
        const d = JSON.parse(raw);
        if (d.history) setHistory(d.history);
        if (d.pbs) setPersonalBests(d.pbs);
        if (d.cur) {
          if (d.cur.log) setRideLog(d.cur.log);
          if (d.cur.ds) setDayStart(d.cur.ds);
          if (d.cur.de) setDayEnd(d.cur.de);
          if (d.cur.cl) setClosed(new Set(d.cur.cl));
        }
      }
    } catch (e) {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("challenge-data", JSON.stringify({
        history, pbs: personalBests, cur: { log: rideLog, ds: dayStart, de: dayEnd, cl: Array.from(closed) }
      }));
    } catch (e) {}
  }, [history, personalBests, rideLog, dayStart, dayEnd, closed, loaded]);

  useEffect(() => {
    if (!activeStart) return;
    const i = setInterval(() => setTick(Math.round((Date.now() - new Date(activeStart).getTime()) / 1000)), 1000);
    return () => clearInterval(i);
  }, [activeStart]);
  useEffect(() => {
    if (!dayStart || dayEnd) return;
    const i = setInterval(() => setDayTick(Math.round((Date.now() - new Date(dayStart).getTime()) / 1000)), 1000);
    return () => clearInterval(i);
  }, [dayStart, dayEnd]);

  const toggleClose = useCallback((id) => setClosed(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }), []);
  const goRide = useCallback((id, ll = false) => { setActiveRide(id); setActiveStart(now()); setTick(0); window._ll = ll; }, []);
  const doneRide = useCallback(() => {
    if (!activeRide || !activeStart) return;
    const endTime = now();
    const secs = Math.round((new Date(endTime) - new Date(activeStart)) / 1000);
    setRideLog(p => ({ ...p, [activeRide]: [...(p[activeRide] || []), { start: activeStart, end: endTime, lightningLane: window._ll || false }] }));
    setPersonalBests(prev => {
      const cur = prev[activeRide];
      if (!cur || secs < cur.time) {
        return { ...prev, [activeRide]: { time: secs, date: endTime } };
      }
      return prev;
    });
    if (!rideLog[activeRide]?.length) { setConfetti(true); setTimeout(() => setConfetti(false), 3000); }
    setActiveRide(null); setActiveStart(null); setTick(0); window._ll = false;
  }, [activeRide, activeStart, rideLog]);
  const cancelRide = useCallback(() => { setActiveRide(null); setActiveStart(null); setTick(0); }, []);
  const delEntry = useCallback((rid, idx) => setRideLog(p => { const u = { ...p }; u[rid] = u[rid].filter((_, i) => i !== idx); if (!u[rid].length) delete u[rid]; return u; }), []);

  const saveDayAndReset = useCallback(() => {
    const done = new Set(Object.keys(rideLog));
    const dlRides = ALL_RIDES.filter(r => r.park === "disneyland");
    const dcaRides = ALL_RIDES.filter(r => r.park === "dca");
    const dlDone = dlRides.filter(r => done.has(r.id) || closed.has(r.id)).length;
    const dcaDone = dcaRides.filter(r => done.has(r.id) || closed.has(r.id)).length;
    const ur = ALL_RIDES.filter(r => done.has(r.id)).length;
    const tr = Object.values(rideLog).reduce((s, e) => s + e.length, 0);
    const ll = Object.values(rideLog).reduce((s, e) => s + e.filter(x => x.lightningLane).length, 0);
    const cc = closed.size;
    let dd = null;
    if (dayStart) dd = Math.round((new Date(dayEnd || now()) - new Date(dayStart)) / 1000);
    const logSnapshot = Object.entries(rideLog)
      .flatMap(([rid, ents]) => ents.map(e => ({ rid, ...e, name: ALL_RIDES.find(r => r.id === rid)?.name, land: ALL_RIDES.find(r => r.id === rid)?.land, park: ALL_RIDES.find(r => r.id === rid)?.park })))
      .sort((a, b) => new Date(a.end) - new Date(b.end));
    setHistory(p => [{ id: Date.now(), date: dayStart || now(), ds: dayStart, de: dayEnd || (dayStart ? now() : null), dur: dd, ur, tr, ll, cc, dlDone, dcaDone, dlTotal: dlRides.length, dcaTotal: dcaRides.length, pct: ALL_RIDES.length > 0 ? Math.round(((dlDone + dcaDone) / ALL_RIDES.length) * 100) : 0, tot: ALL_RIDES.length, log: logSnapshot }, ...p]);
    setRideLog({}); setActiveRide(null); setActiveStart(null); setDayStart(null); setDayEnd(null); setDayTick(0); setClosed(new Set()); setTick(0); setOpenLand(null); setView("stats");
  }, [rideLog, closed, dayStart, dayEnd]);

  const park = PARKS[activePark];
  const ridden = new Set(Object.keys(rideLog));
  const totalRides = Object.values(rideLog).reduce((s, e) => s + e.length, 0);
  const totalLL = Object.values(rideLog).reduce((s, e) => s + e.filter(x => x.lightningLane).length, 0);
  const allDone = ALL_RIDES.filter(r => ridden.has(r.id) || closed.has(r.id)).length;
  const pct = ALL_RIDES.length > 0 ? (allDone / ALL_RIDES.length) * 100 : 0;
  const info = activeRide ? ALL_RIDES.find(r => r.id === activeRide) : null;
  const mm = Math.floor(tick / 60), ss = tick % 60;

  const B = (bg, fg, x = {}) => ({ padding: "10px 16px", borderRadius: 10, border: "none", background: bg, color: fg, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", ...x });

  const shareRide = useCallback((rideName, land, parkName, rideNum, isLL, llNum) => {
    const parkEmoji = parkName === "Disneyland Park" ? "🏰" : "🎡";
    const llText = isLL ? ` · ⚡ Lightning Lane #${llNum}` : "";
    const text = `🎢 Just rode ${rideName} at ${parkEmoji} ${parkName}!${rideNum ? ` · Ride #${rideNum} of ${ALL_RIDES.length}` : ""}${llText}\n\n#Disneyland #EveryRideDLR @RideEvery\n\nHelp me support @GKTWVillage by donating at the link below.\n\nhttps://give.gktw.org/fundraiser/7070034`;
    const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(xUrl, "_blank");
  }, []);
  return (
    <div style={{ minHeight: "100vh", background: "#fff", color: "#1c1c1e", fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        @keyframes fall{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}
        *{box-sizing:border-box}
      `}</style>
      <Confetti active={confetti} />

      <div style={{ padding: "20px 20px 14px", borderBottom: "1px solid #e5e5ea" }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#8e8e93" }}>Disneyland Resort</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "2px 0 0" }}>Ride Everything Challenge</h1>
        <div style={{ marginTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#8e8e93", marginBottom: 4 }}>
            <span>{allDone}/{ALL_RIDES.length} rides{closed.size > 0 ? ` · ${closed.size} closed` : ""}</span>
            <span style={{ fontWeight: 700, color: "#007aff" }}>{Math.round(pct)}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: "#f2f2f7" }}>
            <div style={{ height: "100%", borderRadius: 3, width: `${pct}%`, background: pct === 100 ? "#34c759" : "#007aff", transition: "width 0.4s ease" }} />
          </div>
        </div>
      </div>

      <div style={{ margin: "10px 16px", padding: "12px 16px", borderRadius: 12, background: "#f2f2f7", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: dayStart && !dayEnd ? "#007aff" : "#8e8e93" }}>
            {!dayStart ? "Day Timer" : dayEnd ? "Day Complete" : "In Progress"}
          </div>
          <div style={{ fontSize: dayStart ? 26 : 18, fontWeight: 800, color: dayEnd ? "#34c759" : dayStart ? "#1c1c1e" : "#c7c7cc", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
            {fmtSecs(dayEnd ? Math.round((new Date(dayEnd) - new Date(dayStart)) / 1000) : dayStart ? dayTick : 0)}
          </div>
          {dayStart && <div style={{ fontSize: 12, color: "#8e8e93", marginTop: 1 }}>Started {fmtTime(dayStart)}{dayEnd ? ` · Ended ${fmtTime(dayEnd)}` : ""}</div>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {!dayStart && <button onClick={() => { setDayStart(now()); setDayEnd(null); setDayTick(0); }} style={B("#007aff", "#fff")}>▶ Start</button>}
          {dayStart && !dayEnd && <button onClick={() => setDayEnd(now())} style={B("#ff3b30", "#fff")}>■ Stop</button>}
          {dayEnd && <button onClick={() => { setDayStart(null); setDayEnd(null); setDayTick(0); }} style={B("#f2f2f7", "#8e8e93", { border: "1px solid #d1d1d6" })}>↺ Reset</button>}
        </div>
      </div>

      {activeRide && (
        <div style={{ margin: "0 16px 10px", padding: 16, borderRadius: 12, background: "#eff6ff", border: "2px solid #007aff" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#007aff" }}>Now Riding</div>
          <div style={{ fontSize: 17, fontWeight: 700, marginTop: 3 }}>{info?.name}</div>
          <div style={{ fontSize: 13, color: "#8e8e93", marginTop: 1 }}>
            {info?.land}{window._ll && <span style={{ color: "#ff9500", marginLeft: 8, fontWeight: 700 }}>⚡ Lightning Lane</span>}
          </div>
          <div style={{ fontSize: 42, fontWeight: 800, textAlign: "center", margin: "10px 0", fontVariantNumeric: "tabular-nums" }}>
            {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={doneRide} style={B("#34c759", "#fff", { flex: 1, fontSize: 16 })}>✓ Complete</button>
            <button onClick={() => { const llCount = Object.values(rideLog).reduce((s, e) => s + e.filter(x => x.lightningLane).length, 0) + (window._ll ? 1 : 0); shareRide(info?.name, info?.land, info?.parkName, allDone + 1, window._ll, llCount); }} style={B("#1d9bf0", "#fff", { padding: "10px 14px" })}>𝕏</button>
            <button onClick={cancelRide} style={B("#f2f2f7", "#8e8e93", { border: "1px solid #d1d1d6" })}>✕</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", padding: "0 16px", gap: 2, marginBottom: 10, position: "sticky", top: 0, zIndex: 10, background: "#fff", paddingTop: 6, paddingBottom: 6 }}>
        {[["tracker", "🎢 Rides"], ["log", "📋 Log"], ["stats", "📊 Stats"], ["history", "🏆 Records"]].map(([k, l]) => (
          <button key={k} onClick={() => setView(k)} style={{
            flex: 1, padding: "9px 0", borderRadius: 8, border: "none",
            background: view === k ? "#007aff" : "transparent",
            color: view === k ? "#fff" : "#8e8e93",
            fontSize: 13, fontWeight: view === k ? 700 : 500, cursor: "pointer", fontFamily: "inherit",
          }}>{l}</button>
        ))}
      </div>

      {view === "tracker" && (
        <div style={{ padding: "0 16px 80px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "8px 12px", borderRadius: 10, background: waitTimesError ? "#fef2f2" : "#f2f2f7" }}>
            <div style={{ fontSize: 12, color: "#8e8e93" }}>
              {waitTimesLoading ? "Loading wait times..." :
               waitTimesError ? "Wait times unavailable" :
               waitTimesUpdated ? `Updated ${fmtTime(waitTimesUpdated)}` :
               "Loading..."}
              {Object.keys(waitTimes).length > 0 && (
                <span style={{ marginLeft: 4 }}>· <a href="https://queue-times.com/en-US" target="_blank" rel="noopener noreferrer" style={{ color: "#8e8e93", textDecoration: "underline" }}>Queue-Times.com</a></span>
              )}
            </div>
            <button onClick={fetchWaitTimes} disabled={waitTimesLoading} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #d1d1d6", background: "#fff", color: "#007aff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: waitTimesLoading ? 0.5 : 1 }}>
              ↻
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {Object.entries(PARKS).map(([k, p]) => {
              const pr = ALL_RIDES.filter(r => r.park === k);
              const pc = pr.filter(r => ridden.has(r.id) || closed.has(r.id)).length;
              return (
                <button key={k} onClick={() => { setActivePark(k); setOpenLand(null); }} style={{
                  flex: 1, padding: 12, borderRadius: 12, textAlign: "left", cursor: "pointer", fontFamily: "inherit",
                  border: activePark === k ? "2px solid #007aff" : "1px solid #d1d1d6",
                  background: activePark === k ? "#eff6ff" : "#f2f2f7", color: "#1c1c1e",
                }}>
                  <div style={{ fontSize: 18 }}>{p.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "#8e8e93", marginTop: 1 }}>{pc}/{pr.length}</div>
                </button>
              );
            })}
          </div>

          {Object.entries(park.lands).map(([land, rides]) => {
            if (!rides.length) return null;
            const exp = openLand === land;
            const lc = rides.filter(r => ridden.has(`${activePark}-${r}`) || closed.has(`${activePark}-${r}`)).length;
            const lcl = rides.filter(r => closed.has(`${activePark}-${r}`)).length;
            const done = lc === rides.length;
            return (
              <div key={land} style={{ marginBottom: 6, borderRadius: 12, background: done ? "#f2f2f7" : "#eff6ff", border: done ? "1px solid #d1d1d6" : "1px solid #a8d4ff", overflow: "hidden" }}>
                <button onClick={() => setOpenLand(exp ? null : land)} style={{ width: "100%", padding: "16px 16px", border: "none", background: "transparent", color: "#1c1c1e", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", fontFamily: "inherit" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {done && <span style={{ color: "#34c759", fontWeight: 700, fontSize: 20 }}>✓</span>}
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: done ? "#8e8e93" : "#1c1c1e" }}>{land}</div>
                      <div style={{ fontSize: 14, color: done ? "#aeaeb2" : "#007aff", fontWeight: done ? 400 : 600 }}>{lc}/{rides.length}{lcl > 0 ? ` · ${lcl} closed` : ""}</div>
                    </div>
                  </div>
                  <span style={{ color: "#c7c7cc", fontSize: 12, transform: exp ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
                </button>
                {exp && <div style={{ padding: "0 10px 10px" }}>
                  {rides.map(ride => {
                    const rid = `${activePark}-${ride}`;
                    const ok = ridden.has(rid);
                    const cl = closed.has(rid);
                    const act = activeRide === rid;
                    const rc = rideLog[rid]?.length || 0;
                    return (
                      <div key={ride} style={{
                        padding: "14px 14px", marginBottom: 6, borderRadius: 12,
                        background: cl ? "#fef2f2" : ok ? "#f0fdf4" : act ? "#eff6ff" : "#fff",
                        border: act ? "2px solid #007aff" : `1px solid ${cl ? "#fecaca" : ok ? "#bbf7d0" : "#e5e5ea"}`,
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        opacity: cl ? 0.6 : 1,
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 17, fontWeight: 600, color: cl ? "#ef4444" : ok ? "#16a34a" : "#1c1c1e", textDecoration: cl ? "line-through" : "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {cl ? "🚫 " : ok ? "✓ " : ""}{ride}
                          </div>
                          {cl && <div style={{ fontSize: 13, color: "#ef4444", marginTop: 2 }}>Closed today</div>}
                          {!cl && rc > 0 && <div style={{ fontSize: 13, color: "#8e8e93", marginTop: 2 }}>Ridden {rc}× · Last: {fmtTime(rideLog[rid][rc - 1].end)}{waitTimes[rid]?.isOpen ? ` · ${waitTimes[rid].wait}m wait` : ""}</div>}
                          {!cl && rc === 0 && waitTimes[rid] && (
                            <div style={{ fontSize: 13, color: waitTimes[rid].isOpen ? "#007aff" : "#8e8e93", marginTop: 2 }}>
                              {waitTimes[rid].isOpen ? `${waitTimes[rid].wait} min wait` : "Currently closed"}
                            </div>
                          )}
                        </div>
                        {!act && !activeRide && (
                          <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 8 }}>
                            {!cl && <>
                              <button onClick={() => goRide(rid)} style={B("#007aff", "#fff", { padding: "10px 18px", fontSize: 15 })}>▶ Go</button>
                              {LIGHTNING_LANE_RIDES.has(rid) && <button onClick={() => goRide(rid, true)} style={B("#fff7ed", "#ea580c", { padding: "10px 14px", fontSize: 15, border: "1px solid #fed7aa" })}>⚡ LL</button>}
                            </>}
                            <button onClick={() => toggleClose(rid)} style={B(cl ? "#f0fdf4" : "#fef2f2", cl ? "#16a34a" : "#ef4444", { padding: "10px 14px", fontSize: 15 })}>
                              {cl ? "↺" : "🚫"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>}
              </div>
            );
          })}
        </div>
      )}
      {view === "log" && (
        <div style={{ padding: "0 16px 80px" }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Ride Log <span style={{ fontSize: 14, fontWeight: 400, color: "#8e8e93" }}>{totalRides} total</span></div>
          {totalRides === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#8e8e93" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎢</div>
              <div>No rides logged yet.</div>
            </div>
          ) : (
            Object.entries(rideLog)
              .flatMap(([rid, ents]) => ents.map((e, idx) => ({ rid, e, idx, r: ALL_RIDES.find(x => x.id === rid) })))
              .sort((a, b) => new Date(b.e.end) - new Date(a.e.end))
              .map(({ rid, e, idx, r }) => (
                <div key={`${rid}-${idx}`} style={{ padding: "12px 14px", marginBottom: 6, borderRadius: 10, background: "#f2f2f7", border: "1px solid #e5e5ea" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>
                        {r?.name}
                        {e.lightningLane && <span style={{ marginLeft: 8, fontSize: 11, color: "#ea580c", background: "#fff7ed", padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>⚡ LL</span>}
                      </div>
                      <div style={{ fontSize: 12, color: "#8e8e93", marginTop: 2 }}>{r?.land} · {r?.park === "disneyland" ? "🏰" : "🎡"}</div>
                    </div>
                    <button onClick={() => delEntry(rid, idx)} style={{ background: "none", border: "none", color: "#c7c7cc", cursor: "pointer", fontSize: 16 }}>✕</button>
                  </div>
                  <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 13, alignItems: "center" }}>
                    <div><span style={{ color: "#8e8e93" }}>Start </span><span style={{ fontWeight: 600 }}>{fmtTime(e.start)}</span></div>
                    <div><span style={{ color: "#8e8e93" }}>End </span><span style={{ fontWeight: 600 }}>{fmtTime(e.end)}</span></div>
                    <div><span style={{ color: "#8e8e93" }}>Dur </span><span style={{ fontWeight: 600 }}>{fmtDur(e.start, e.end)}</span></div>
                    <button onClick={() => { const llNum = e.lightningLane ? Object.entries(rideLog).flatMap(([id, ents]) => ents.filter(x => x.lightningLane).map(x => x)).filter(x => new Date(x.end) <= new Date(e.end)).length : 0; shareRide(r?.name, r?.land, r?.parkName, null, e.lightningLane, llNum); }} style={{ marginLeft: "auto", padding: "4px 10px", borderRadius: 6, border: "1px solid #d1d1d6", background: "#fff", color: "#1d9bf0", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>𝕏 Share</button>
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {view === "stats" && (
        <div style={{ padding: "0 16px 80px" }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Today</div>
          {(() => {
            const dlRides = ALL_RIDES.filter(r => r.park === "disneyland");
            const dcaRides = ALL_RIDES.filter(r => r.park === "dca");
            const dlDone = dlRides.filter(r => ridden.has(r.id) || closed.has(r.id)).length;
            const dcaDone = dcaRides.filter(r => ridden.has(r.id) || closed.has(r.id)).length;
            const dayS = dayEnd ? Math.round((new Date(dayEnd) - new Date(dayStart)) / 1000) : dayStart ? dayTick : 0;
            const dayStr = dayStart ? `${Math.floor(dayS / 3600)}h ${Math.floor((dayS % 3600) / 60)}m` : "--";
            return (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <div style={{ flex: 1, padding: "12px 14px", borderRadius: 12, background: "#f2f2f7" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#8e8e93", textTransform: "uppercase", letterSpacing: 1 }}>🏰 Disneyland</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#1c1c1e", marginTop: 2 }}>{dlDone}<span style={{ fontSize: 14, fontWeight: 400, color: "#8e8e93" }}>/{dlRides.length}</span></div>
                  </div>
                  <div style={{ flex: 1, padding: "12px 14px", borderRadius: 12, background: "#f2f2f7" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#8e8e93", textTransform: "uppercase", letterSpacing: 1 }}>🎡 DCA</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#1c1c1e", marginTop: 2 }}>{dcaDone}<span style={{ fontSize: 14, fontWeight: 400, color: "#8e8e93" }}>/{dcaRides.length}</span></div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <div style={{ flex: 1, padding: "12px 14px", borderRadius: 12, background: "#f2f2f7" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#8e8e93", textTransform: "uppercase", letterSpacing: 1 }}>Total Rides</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#1c1c1e", marginTop: 2 }}>{allDone}<span style={{ fontSize: 14, fontWeight: 400, color: "#8e8e93" }}>/{ALL_RIDES.length}</span></div>
                  </div>
                  <div style={{ flex: 1, padding: "12px 14px", borderRadius: 12, background: "#f2f2f7" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#8e8e93", textTransform: "uppercase", letterSpacing: 1 }}>Day Time</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#1c1c1e", marginTop: 2 }}>{dayStr}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1, padding: "12px 14px", borderRadius: 12, background: "#f2f2f7" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#8e8e93", textTransform: "uppercase", letterSpacing: 1 }}>⚡ Lightning Lane</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#1c1c1e", marginTop: 2 }}>{totalLL}</div>
                  </div>
                  <div style={{ flex: 1, padding: "12px 14px", borderRadius: 12, background: "#f2f2f7" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#8e8e93", textTransform: "uppercase", letterSpacing: 1 }}>🚫 Closed</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#1c1c1e", marginTop: 2 }}>{closed.size}</div>
                  </div>
                </div>
              </div>
            );
          })()}

          {pct === 100 && (
            <div style={{ marginBottom: 16, padding: 18, borderRadius: 14, background: "#f0fdf4", border: "2px solid #34c759", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 4 }}>🎉🏰🎢</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#16a34a" }}>Challenge Complete!</div>
            </div>
          )}

          {totalRides > 0 && (
            <button onClick={saveDayAndReset} style={{ width: "100%", marginBottom: 20, padding: "15px 0", borderRadius: 12, border: "2px solid #ff9500", background: "#fff7ed", color: "#c2410c", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              💾 Save Day & Start New Challenge
            </button>
          )}

          {history.length > 0 && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Past Days</div>
              {history.map(ch => {
                const d = new Date(ch.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
                const dur = ch.dur ? `${Math.floor(ch.dur / 3600)}h ${Math.floor((ch.dur % 3600) / 60)}m` : "--";
                const isExp = expandedDay === ch.id;
                return (
                  <div key={ch.id} style={{ marginBottom: 6, borderRadius: 12, background: "#f2f2f7", border: "1px solid #e5e5ea", overflow: "hidden" }}>
                    <button onClick={() => setExpandedDay(isExp ? null : ch.id)} style={{ width: "100%", padding: "14px 16px", border: "none", background: "transparent", color: "#1c1c1e", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", fontFamily: "inherit" }}>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>{d}</div>
                        <div style={{ fontSize: 13, color: "#8e8e93", marginTop: 1 }}>{ch.tr} rides · {dur}</div>
                      </div>
                      <span style={{ color: "#c7c7cc", fontSize: 12, transform: isExp ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
                    </button>
                    {isExp && (
                      <div style={{ padding: "0 16px 14px" }}>
                        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                          <div style={{ flex: 1, padding: "8px 10px", borderRadius: 8, background: "#fff" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "#8e8e93", textTransform: "uppercase" }}>🏰 Disneyland</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: "#1c1c1e" }}>{ch.dlDone ?? "—"}<span style={{ fontSize: 12, fontWeight: 400, color: "#8e8e93" }}>/{ch.dlTotal ?? "—"}</span></div>
                          </div>
                          <div style={{ flex: 1, padding: "8px 10px", borderRadius: 8, background: "#fff" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "#8e8e93", textTransform: "uppercase" }}>🎡 DCA</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: "#1c1c1e" }}>{ch.dcaDone ?? "—"}<span style={{ fontSize: 12, fontWeight: 400, color: "#8e8e93" }}>/{ch.dcaTotal ?? "—"}</span></div>
                          </div>
                          <div style={{ flex: 1, padding: "8px 10px", borderRadius: 8, background: "#fff" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "#8e8e93", textTransform: "uppercase" }}>Total</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: "#1c1c1e" }}>{ch.tr}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                          <div style={{ flex: 1, padding: "8px 10px", borderRadius: 8, background: "#fff" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "#8e8e93", textTransform: "uppercase" }}>Day Time</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: "#1c1c1e" }}>{dur}</div>
                          </div>
                          <div style={{ flex: 1, padding: "8px 10px", borderRadius: 8, background: "#fff" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "#8e8e93", textTransform: "uppercase" }}>⚡ LL</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: "#1c1c1e" }}>{ch.ll}</div>
                          </div>
                          <div style={{ flex: 1, padding: "8px 10px", borderRadius: 8, background: "#fff" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "#8e8e93", textTransform: "uppercase" }}>🚫 Closed</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: "#1c1c1e" }}>{ch.cc}</div>
                          </div>
                        </div>
                        {ch.ds && <div style={{ fontSize: 12, color: "#8e8e93", marginBottom: 10 }}>{fmtTime(ch.ds)} → {fmtTime(ch.de)}</div>}
                        {ch.log && ch.log.length > 0 && (
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Ride Log</div>
                            {ch.log.map((entry, i) => (
                              <div key={i} style={{ padding: "8px 10px", marginBottom: 3, borderRadius: 8, background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {entry.name}
                                    {entry.lightningLane && <span style={{ marginLeft: 6, fontSize: 10, color: "#ea580c" }}>⚡</span>}
                                  </div>
                                  <div style={{ fontSize: 11, color: "#8e8e93" }}>{entry.land} · {entry.park === "disneyland" ? "🏰" : "🎡"}</div>
                                </div>
                                <div style={{ fontSize: 12, color: "#8e8e93", flexShrink: 0, marginLeft: 8, textAlign: "right" }}>
                                  <div>{fmtTime(entry.end)}</div>
                                  <div>{fmtDur(entry.start, entry.end)}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <button onClick={() => { setHistory(p => p.filter(c => c.id !== ch.id)); setExpandedDay(null); }} style={{ marginTop: 10, padding: "8px 14px", borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Delete Day</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {view === "history" && (
        <div style={{ padding: "0 16px 80px" }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Personal Records</div>
          {(() => {
            const pbEntries = Object.entries(personalBests);
            const pbCount = pbEntries.length;
            if (pbCount === 0) return (
              <div style={{ textAlign: "center", padding: 40, color: "#8e8e93" }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🏆</div>
                <div>No personal records yet.</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Complete rides to set your best times.</div>
              </div>
            );
            const times = pbEntries.map(([, v]) => v.time);
            const fastest = Math.min(...times);
            const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
            const fastestRide = ALL_RIDES.find(r => r.id === pbEntries.find(([, v]) => v.time === fastest)?.[0]);
            const dlRides = ALL_RIDES.filter(r => r.park === "disneyland");
            const dcaRides = ALL_RIDES.filter(r => r.park === "dca");
            const fmtPB = (s) => { if (s < 60) return `${s}s`; const m = Math.floor(s / 60); const sec = s % 60; return sec > 0 ? `${m}m ${sec}s` : `${m}m`; };
            const renderParkSection = (parkRides, parkName, parkIcon) => {
              const lands = {};
              parkRides.forEach(r => { if (!lands[r.land]) lands[r.land] = []; lands[r.land].push(r); });
              return (
                <div key={parkName} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{parkIcon} {parkName}</div>
                  {Object.entries(lands).map(([land, rides]) => (
                    <div key={land} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: LAND_COLORS[land] || "#8e8e93", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, paddingLeft: 2 }}>{land}</div>
                      {rides.map(ride => {
                        const pb = personalBests[ride.id];
                        return (
                          <div key={ride.id} style={{ padding: "12px 14px", marginBottom: 4, borderRadius: 10, background: pb ? "#f0fdf4" : "#f2f2f7", border: `1px solid ${pb ? "#bbf7d0" : "#e5e5ea"}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 15, fontWeight: 600, color: pb ? "#1c1c1e" : "#aeaeb2", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pb ? "🏆 " : ""}{ride.name}</div>
                              {pb && <div style={{ fontSize: 11, color: "#8e8e93", marginTop: 1 }}>Set {new Date(pb.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>}
                            </div>
                            <div style={{ fontWeight: 800, fontSize: pb ? 18 : 14, color: pb ? "#16a34a" : "#d1d1d6", flexShrink: 0, marginLeft: 10 }}>{pb ? fmtPB(pb.time) : "—"}</div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              );
            };
            return <>
              <div style={{ padding: 14, marginBottom: 14, borderRadius: 12, background: "#fffbeb", border: "1px solid #fde68a" }}>
                <div style={{ display: "flex", gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#8e8e93", textTransform: "uppercase", letterSpacing: 1 }}>Records Set</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#d97706" }}>{pbCount}<span style={{ fontSize: 13, fontWeight: 400, color: "#8e8e93" }}>/{ALL_RIDES.length}</span></div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#8e8e93", textTransform: "uppercase", letterSpacing: 1 }}>Fastest</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#16a34a" }}>{fmtPB(fastest)}</div>
                    <div style={{ fontSize: 10, color: "#8e8e93" }}>{fastestRide?.name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#8e8e93", textTransform: "uppercase", letterSpacing: 1 }}>Average</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#007aff" }}>{fmtPB(avg)}</div>
                  </div>
                </div>
              </div>
              {renderParkSection(dlRides, "Disneyland Park", "🏰")}
              {renderParkSection(dcaRides, "Disney California Adventure", "🎡")}
              {!confirmReset ? (
                <button onClick={() => setConfirmReset(true)} style={{ width: "100%", marginTop: 12, padding: "13px 0", borderRadius: 12, border: "1px solid #fecaca", background: "#fef2f2", color: "#ef4444", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Reset All Records</button>
              ) : (
                <div style={{ marginTop: 12, padding: 14, borderRadius: 12, background: "#fef2f2", border: "1px solid #fecaca", textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#ef4444", marginBottom: 10 }}>Clear all personal records? This cannot be undone.</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setConfirmReset(false)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #d1d1d6", background: "#fff", color: "#8e8e93", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                    <button onClick={() => { setPersonalBests({}); setConfirmReset(false); }} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "#ef4444", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Yes, Reset</button>
                  </div>
                </div>
              )}
            </>;
          })()}
        </div>
      )}
    </div>
  );
}
