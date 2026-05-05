import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Home as HomeIcon,
  Receipt,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { getExpenses, getInvoices } from "../../services/financeService";
import { getReportOverview } from "../../services/reportService";
import { getMyRoom } from "../../services/roomService";
import { getTasks } from "../../services/taskService";
import "./home.css";

function getTodayIso() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatCurrency(value, locale, suffix) {
  return `${Number(value || 0).toLocaleString(locale)} ${suffix}`;
}

function getInvoiceStatusMeta(status, t) {
  switch (status) {
    case "completed":
      return { label: t("dashboard.invoiceCompleted"), tone: "success" };
    case "processing":
      return { label: t("dashboard.invoiceProcessing"), tone: "warning" };
    default:
      return { label: t("dashboard.invoicePending"), tone: "danger" };
  }
}

function DashboardTooltip({ active, payload, label, locale, t }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="home-tooltip">
      <strong>{label}</strong>
      <span>{formatCurrency(payload[0].value, locale, t("common.currencySuffix"))}</span>
    </div>
  );
}

function Home() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const [room, setRoom] = useState(null);
  const [overview, setOverview] = useState({
    expenseTrend: [],
    memberDebts: [],
    taskStats: [],
  });
  const [expenses, setExpenses] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [todayTasks, setTodayTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        setError("");

        const myRoom = await getMyRoom();
        setRoom(myRoom);

        if (!myRoom) {
          setOverview({ expenseTrend: [], memberDebts: [], taskStats: [] });
          setExpenses([]);
          setInvoices([]);
          setTodayTasks([]);
          return;
        }

        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const today = getTodayIso();

        const [overviewData, expenseData, invoiceData, taskData] = await Promise.all([
          getReportOverview(),
          getExpenses(month, year),
          getInvoices(),
          getTasks(today, today),
        ]);

        setOverview(overviewData);
        setExpenses(expenseData);
        setInvoices(invoiceData);
        setTodayTasks(taskData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="home-state">{t("common.loadingDashboard")}</div>;
  }

  if (error) {
    return <div className="home-state home-state--error">{t("common.errorPrefix", { message: error })}</div>;
  }

  if (!room) {
    return (
      <section className="home home--empty">
        <div className="home-empty-card">
          <div className="home-empty-card__icon">
            <HomeIcon size={28} />
          </div>
          <h1>{t("dashboard.noRoomTitle")}</h1>
          <p>{t("dashboard.noRoomBody")}</p>
          <Link to="/rooms" className="home-link-button">
            {t("dashboard.goToRooms")}
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    );
  }

  const expenseTrend = overview.expenseTrend || [];
  const memberDebts = overview.memberDebts || [];
  const taskStats = overview.taskStats || [];
  const totalMonthlyExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalDebt = memberDebts.reduce((sum, item) => sum + Number(item.total_debt || 0), 0);
  const unpaidMembers = memberDebts.length;
  const pendingTasks = todayTasks.filter((task) => task.status !== "done").length;
  const completedTasks = todayTasks.filter((task) => task.status === "done").length;
  const latestInvoice = invoices[0] || null;
  const latestInvoiceMeta = latestInvoice ? getInvoiceStatusMeta(latestInvoice.status, t) : null;
  const recentExpenses = expenses.slice(0, 4);
  const debtLeaders = memberDebts.slice(0, 3);
  const topTaskPerformers = [...taskStats].slice(0, 3);
  const longDate = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(getTodayIso()));
  const shortDate = (value) =>
    new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit" }).format(new Date(value));

  const notifications = [];

  if (latestInvoice) {
    notifications.push({
      title: t("dashboard.notificationInvoice", {
        month: latestInvoice.month,
        year: latestInvoice.year,
      }),
      description: t("dashboard.notificationInvoiceBody", { status: latestInvoiceMeta.label }),
      tone: latestInvoiceMeta.tone,
      link: "/invoice",
      linkLabel: t("dashboard.openInvoice"),
    });
  }

  if (pendingTasks > 0) {
    notifications.push({
      title: t("dashboard.notificationTasks", { count: pendingTasks }),
      description: t("dashboard.notificationTasksBody"),
      tone: "warning",
      link: "/duty",
      linkLabel: t("dashboard.openDuty"),
    });
  }

  if (unpaidMembers > 0) {
    notifications.push({
      title: t("dashboard.notificationDebt", { count: unpaidMembers }),
      description: t("dashboard.notificationDebtBody"),
      tone: "danger",
      link: "/report",
      linkLabel: t("dashboard.openReport"),
    });
  }

  if (notifications.length === 0) {
    notifications.push({
      title: t("dashboard.notificationStable"),
      description: t("dashboard.notificationStableBody"),
      tone: "success",
      link: "/rooms",
      linkLabel: t("dashboard.openRoomInfo"),
    });
  }

  return (
    <section className="home">
      <div className="home-hero">
        <div className="home-hero__copy">
          <div className="home-pill">
            <Sparkles size={16} />
            {t("dashboard.heroBadge")}
          </div>
          <h1>
            {t("dashboard.heroGreetingPrefix", {
              name: user?.full_name || t("common.member").toLowerCase(),
            })}{" "}
            <span>{room.name}</span>
          </h1>
          <p>{t("dashboard.heroSubtitle")}</p>

          <div className="home-hero__actions">
            <Link to="/costs" className="home-link-button">
              {t("dashboard.addExpense")}
              <ArrowRight size={16} />
            </Link>
            <Link to="/duty" className="home-secondary-link">
              {t("dashboard.viewTodayTasks")}
            </Link>
          </div>
        </div>

        <div className="home-hero__card">
          <div className="home-room-badge">
            {room.currentUserRole === "admin" ? t("common.admin") : t("common.member")}
          </div>
          <div className="home-room-line">
            <span>{t("dashboard.roomAddress")}</span>
            <strong>{room.address || t("common.noAddress")}</strong>
          </div>
          <div className="home-room-line">
            <span>{t("dashboard.roomCode")}</span>
            <strong>{room.invite_code}</strong>
          </div>
          <div className="home-room-line">
            <span>{t("dashboard.roomMembers")}</span>
            <strong>{t("dashboard.membersCount", { count: room.members.length })}</strong>
          </div>
        </div>
      </div>

      <div className="home-stats">
        <article className="home-stat-card">
          <div className="home-stat-card__icon home-stat-card__icon--cyan">
            <Wallet size={20} />
          </div>
          <span className="home-stat-card__label">{t("dashboard.totalMonthlyExpense")}</span>
          <strong className="home-stat-card__value">
            {formatCurrency(totalMonthlyExpense, locale, t("common.currencySuffix"))}
          </strong>
          <p className="home-stat-card__hint">{t("dashboard.expenseCount", { count: expenses.length })}</p>
        </article>

        <article className="home-stat-card">
          <div className="home-stat-card__icon home-stat-card__icon--amber">
            <Users size={20} />
          </div>
          <span className="home-stat-card__label">{t("dashboard.unpaidMembers")}</span>
          <strong className="home-stat-card__value">{unpaidMembers}</strong>
          <p className="home-stat-card__hint">{t("dashboard.unpaidHint")}</p>
        </article>

        <article className="home-stat-card">
          <div className="home-stat-card__icon home-stat-card__icon--rose">
            <CircleDollarSign size={20} />
          </div>
          <span className="home-stat-card__label">{t("dashboard.totalDebt")}</span>
          <strong className="home-stat-card__value">
            {formatCurrency(totalDebt, locale, t("common.currencySuffix"))}
          </strong>
          <p className="home-stat-card__hint">{t("dashboard.debtHint")}</p>
        </article>

        <article className="home-stat-card">
          <div className="home-stat-card__icon home-stat-card__icon--emerald">
            <CheckCircle2 size={20} />
          </div>
          <span className="home-stat-card__label">{t("dashboard.todayTasks")}</span>
          <strong className="home-stat-card__value">
            {completedTasks}/{todayTasks.length || 0}
          </strong>
          <p className="home-stat-card__hint">
            {pendingTasks > 0 ? t("dashboard.tasksHintPending", { count: pendingTasks }) : t("dashboard.tasksHintDone")}
          </p>
        </article>
      </div>

      <div className="home-grid home-grid--primary">
        <article className="home-card home-card--chart">
          <div className="home-card__header">
            <div>
              <h2>{t("dashboard.chartTitle")}</h2>
              <p>{t("dashboard.chartSubtitle")}</p>
            </div>
            <Link to="/report" className="home-inline-link">
              {t("dashboard.reportLink")}
            </Link>
          </div>

          {expenseTrend.length > 0 ? (
            <div className="home-chart">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={expenseTrend} margin={{ top: 12, right: 6, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashboardArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(148, 163, 184, 0.24)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                  />
                  <Tooltip content={<DashboardTooltip locale={locale} t={t} />} />
                  <Area type="monotone" dataKey="amount" stroke="#0284c7" strokeWidth={3} fill="url(#dashboardArea)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="home-empty-block">{t("dashboard.chartEmpty")}</div>
          )}
        </article>

        <article className="home-card">
          <div className="home-card__header">
            <div>
              <h2>{t("dashboard.tasksTitle")}</h2>
              <p>{longDate}</p>
            </div>
            <Link to="/duty" className="home-inline-link">
              {t("dashboard.openDuty")}
            </Link>
          </div>

          {todayTasks.length > 0 ? (
            <div className="home-task-list">
              {todayTasks.map((task) => (
                <div key={task.id} className="home-task-item">
                  <div className={`home-task-status ${task.status === "done" ? "done" : "pending"}`}>
                    {task.status === "done" ? <CheckCircle2 size={16} /> : <Clock3 size={16} />}
                  </div>
                  <div className="home-task-item__content">
                    <strong>{task.title}</strong>
                    <span>
                      {task.assignee_name} · {task.repeat_type === "daily" ? t("dashboard.everyDay") : t("dashboard.everyWeek")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="home-empty-block">{t("dashboard.tasksEmpty")}</div>
          )}
        </article>
      </div>

      <div className="home-grid home-grid--secondary">
        <article className="home-card">
          <div className="home-card__header">
            <div>
              <h2>{t("dashboard.recentExpensesTitle")}</h2>
              <p>{t("dashboard.recentExpensesSubtitle")}</p>
            </div>
            <Link to="/costs" className="home-inline-link">
              {t("dashboard.viewAllCosts")}
            </Link>
          </div>

          {recentExpenses.length > 0 ? (
            <div className="home-expense-list">
              {recentExpenses.map((expense) => (
                <div key={expense.id} className="home-expense-item">
                  <div className="home-expense-item__icon">
                    <Receipt size={16} />
                  </div>
                  <div className="home-expense-item__content">
                    <strong>{expense.title}</strong>
                    <span>
                      {expense.paid_by_name} · {shortDate(expense.created_at)}
                    </span>
                  </div>
                  <div className="home-expense-item__amount">
                    {formatCurrency(expense.amount, locale, t("common.currencySuffix"))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="home-empty-block">{t("dashboard.recentExpensesEmpty")}</div>
          )}
        </article>

        <article className="home-card">
          <div className="home-card__header">
            <div>
              <h2>{t("dashboard.alertsTitle")}</h2>
              <p>{t("dashboard.alertsSubtitle")}</p>
            </div>
          </div>

          <div className="home-alert-list">
            {notifications.map((item, index) => (
              <div key={`${item.title}-${index}`} className={`home-alert home-alert--${item.tone}`}>
                <div className="home-alert__icon">
                  <AlertTriangle size={16} />
                </div>
                <div className="home-alert__content">
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                  <Link to={item.link} className="home-alert__link">
                    {item.linkLabel}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="home-card">
          <div className="home-card__header">
            <div>
              <h2>{t("dashboard.roomPulseTitle")}</h2>
              <p>{t("dashboard.roomPulseSubtitle")}</p>
            </div>
          </div>

          <div className="home-pulse">
            <div className="home-pulse__section">
              <span className="home-pulse__label">{t("dashboard.latestInvoice")}</span>
              {latestInvoice ? (
                <div className="home-pulse__invoice">
                  <strong>{t("invoice.invoiceFor", { month: latestInvoice.month, year: latestInvoice.year })}</strong>
                  <span className={`home-badge home-badge--${latestInvoiceMeta.tone}`}>
                    {latestInvoiceMeta.label}
                  </span>
                </div>
              ) : (
                <p>{t("dashboard.noInvoiceYet")}</p>
              )}
            </div>

            <div className="home-pulse__section">
              <span className="home-pulse__label">{t("dashboard.topDebts")}</span>
              {debtLeaders.length > 0 ? (
                <div className="home-mini-list">
                  {debtLeaders.map((member) => (
                    <div key={member.id} className="home-mini-list__item">
                      <strong>{member.full_name}</strong>
                      <span>{formatCurrency(member.total_debt, locale, t("common.currencySuffix"))}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p>{t("dashboard.noDebt")}</p>
              )}
            </div>

            <div className="home-pulse__section">
              <span className="home-pulse__label">{t("dashboard.topTaskMembers")}</span>
              {topTaskPerformers.length > 0 ? (
                <div className="home-mini-list">
                  {topTaskPerformers.map((member) => (
                    <div key={member.id} className="home-mini-list__item">
                      <strong>{member.name}</strong>
                      <span>{member.completionRate}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p>{t("dashboard.noTaskStats")}</p>
              )}
            </div>

            <div className="home-pulse__footer">
              <CalendarDays size={16} />
              {t("dashboard.updatedAt", { date: longDate })}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

export default Home;
