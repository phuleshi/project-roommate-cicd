import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getReportOverview } from "../../services/reportService";
import { getMyRoom } from "../../services/roomService";
import { useLanguage } from "../../context/LanguageContext";
import "./ReportPage.css";

function ReportPage() {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expenseTrend, setExpenseTrend] = useState([]);
  const [memberDebts, setMemberDebts] = useState([]);
  const [taskStats, setTaskStats] = useState([]);
  const { t, locale } = useLanguage();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const myRoom = await getMyRoom();
      setRoom(myRoom);

      if (myRoom) {
        const data = await getReportOverview();
        setExpenseTrend(data.expenseTrend);
        setMemberDebts(data.memberDebts);
        setTaskStats(data.taskStats);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="report-loading">{t("report.loading")}</div>;
  if (!room) return <div className="report-error">{t("common.noRoom")}</div>;

  const totalDebt = memberDebts.reduce((sum, item) => sum + item.total_debt, 0);
  const totalCompletedTasks = taskStats.reduce((sum, item) => sum + item.done, 0);
  const totalAssignedTasks = taskStats.reduce((sum, item) => sum + item.total, 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{label}</p>
          <p className="intro">
            {payload[0].value.toLocaleString(locale)} {t("common.currencySuffix")}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="report-container">
      <div className="report-header">
        <h2 className="page-title">{t("report.pageTitle")}</h2>
        <p className="page-subtitle">{t("report.subtitle")}</p>
      </div>

      {error && <div className="report-error">{error}</div>}

      <div className="summary-cards">
        <div className="summary-card debt">
          <div className="icon">💰</div>
          <div className="info">
            <span className="label">{t("report.totalDebt")}</span>
            <strong className="value">{totalDebt.toLocaleString(locale)} đ</strong>
          </div>
        </div>
        <div className="summary-card task">
          <div className="icon">✓</div>
          <div className="info">
            <span className="label">{t("report.monthCompletion")}</span>
            <strong className="value">
              {totalCompletedTasks} / {totalAssignedTasks} {t("common.task").toLowerCase()}
            </strong>
          </div>
        </div>
        <div className="summary-card member">
          <div className="icon">👥</div>
          <div className="info">
            <span className="label">{t("report.memberCount")}</span>
            <strong className="value">{t("report.memberUnit", { count: room.members.length })}</strong>
          </div>
        </div>
      </div>

      <div className="report-main">
        <div className="chart-section">
          <h3>{t("report.expenseChart")}</h3>
          {expenseTrend.length === 0 ? (
            <div className="empty-state">{t("report.noChartData")}</div>
          ) : (
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={expenseTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 13 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 13 }}
                    tickFormatter={(value) => `${value / 1000}k`}
                    dx={-10}
                  />
                  <Tooltip cursor={{ fill: "#f1f5f9" }} content={<CustomTooltip />} />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="lower-grid">
          <div className="ranking-card">
            <h3>{t("report.debtRanking")}</h3>
            <p className="card-desc">{t("report.debtRankingDesc")}</p>
            {memberDebts.length === 0 ? (
              <div className="empty-state small">{t("report.noDebt")}</div>
            ) : (
              <div className="debt-list">
                {memberDebts.map((member, index) => (
                  <div key={member.id} className="debt-item">
                    <div className="rank">#{index + 1}</div>
                    <div className="user-info">
                      <div className="avatar">{member.full_name.charAt(0)}</div>
                      <span>{member.full_name}</span>
                    </div>
                    <div className="debt-amount">{member.total_debt.toLocaleString(locale)} đ</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="ranking-card">
            <h3>{t("report.diligence")}</h3>
            <p className="card-desc">{t("report.diligenceDesc")}</p>
            {taskStats.length === 0 ? (
              <div className="empty-state small">{t("report.noTaskStats")}</div>
            ) : (
              <div className="task-progress-list">
                {taskStats.map((task) => (
                  <div key={task.id} className="progress-item">
                    <div className="progress-header">
                      <span className="user-name">{task.name}</span>
                      <span className="task-count">
                        {t("report.taskUnit", {
                          done: task.done,
                          total: task.total,
                          rate: task.completionRate,
                        })}
                      </span>
                    </div>
                    <div className="progress-bar-bg">
                      <div
                        className={`progress-bar-fill ${
                          task.completionRate >= 80
                            ? "excellent"
                            : task.completionRate >= 50
                              ? "good"
                              : "poor"
                        }`}
                        style={{ width: `${task.completionRate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportPage;
