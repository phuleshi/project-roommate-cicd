import "./Home.css";
function Home() {
  return (
    <main className="home">
      <div className="home__overView">
        <div className="home__title">
          <h2 className="Home__headingTitle"> Dashboard Overview</h2>
        </div>
        <div className="home_costOverview">
          <div className="home__monthlyCosts">CURRENT MONTHLY COST</div>
          <div className="home__payerAmounts">Number of payer</div>
          <div className="home__overdue">Amout outstanding</div>
        </div>
        <div className="home__dutyOverview">Today's Daily Duty</div>
        <div className="home__notiOverview">Notification</div>
      </div>
    </main>
  );
}

export default Home;
