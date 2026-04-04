import React, { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";
const AUTH_TOKEN_KEY = "ff_admin_token";

const PLAN_OPTIONS = [
	{ label: "Monthly" },
	{ label: "Quarterly" },
	{ label: "Yearly" },
];

const PLAN_PRICE_MAP = {
	Monthly: 3000,
	Quarterly: 7500,
	Yearly: 24000,
};

const BANK_OPTIONS = [
	"BOC",
	"People's Bank",
	"Commercial Bank",
	"HNB",
	"Sampath Bank",
	"NSB",
];

function getTrainerMonthlySalaryByRole(role) {
	const normalizedRole = String(role || "").trim().toLowerCase();

	if (normalizedRole === "strength coach" || normalizedRole === "strength instructor") {
		return 55000;
	}

	if (normalizedRole === "yoga instructor") {
		return 45000;
	}

	if (normalizedRole === "cardio trainer" || normalizedRole === "cardio instructor" || normalizedRole === "cradio instructr") {
		return 50000;
	}

	return 0;
}

function getToken() {
	return localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);
}

function formatMoney(value) {
	const safeValue = Number(value || 0);
	return `LKR ${safeValue.toLocaleString("en-LK")}`;
}

function formatDateText(value) {
	if (!value) {
		return "-";
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return "-";
	}

	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function getPlanDurationDays(plan) {
	if (plan === "Quarterly") {
		return 90;
	}

	if (plan === "Yearly") {
		return 365;
	}

	return 30;
}

function calculateDueDateText(baseDate, plan) {
	const parsedBaseDate = new Date(baseDate);
	if (Number.isNaN(parsedBaseDate.getTime())) {
		return "-";
	}

	const dueDate = new Date(parsedBaseDate);
	dueDate.setDate(dueDate.getDate() + getPlanDurationDays(plan));
	return formatDateText(dueDate);
}

function getMemberCreatedAtTime(member) {
	const raw = member && member.createdAt ? member.createdAt : null;
	const time = new Date(raw || 0).getTime();
	return Number.isFinite(time) ? time : 0;
}

function createMemberId(member, maleCountRef, femaleCountRef) {
	const providedId = String((member && member.id) || "").trim();
	if (providedId) {
		return providedId;
	}

	const gender = String((member && member.gender) || "").trim().toLowerCase();
	if (gender === "female") {
		femaleCountRef.current += 1;
		return `F-${String(femaleCountRef.current).padStart(3, "0")}`;
	}

	maleCountRef.current += 1;
	return `M-${String(maleCountRef.current).padStart(3, "0")}`;
}

function normalizeMemberPaymentRow(member, maleCountRef, femaleCountRef) {
	const firstName = String((member && member.firstName) || "").trim();
	const lastName = String((member && member.lastName) || "").trim();
	const fullName = `${firstName} ${lastName}`.trim() || "Unknown Member";
	const normalizedGender = String((member && member.gender) || "").trim().toLowerCase();
	const plan = "Monthly";

	return {
		_id: String((member && member._id) || ""),
		memberId: createMemberId(member, maleCountRef, femaleCountRef),
		name: fullName,
		gender: normalizedGender,
		admissionFee: "Done",
		plan,
		amount: PLAN_PRICE_MAP[plan],
		paymentDate: "-",
		dueDate: calculateDueDateText(new Date(), plan),
		status: "Pending",
	};
}

function normalizeTrainerPaymentRow(trainer) {
	const firstName = String((trainer && trainer.firstName) || "").trim();
	const lastName = String((trainer && trainer.lastName) || "").trim();
	const fullName = `${firstName} ${lastName}`.trim() || "Unknown Trainer";
	const gender = String((trainer && trainer.gender) || "").trim().toLowerCase();
	const monthSalary = Number((trainer && trainer.monthSalary) || 0);
	const resolvedMonthSalary = monthSalary > 0 ? monthSalary : getTrainerMonthlySalaryByRole(trainer && trainer.role);

	return {
		_id: String((trainer && trainer._id) || ""),
		trainerId: String((trainer && trainer.trainerId) || ""),
		name: fullName,
		role: String((trainer && trainer.role) || "-"),
		gender,
		bank: String((trainer && trainer.paymentBank) || "").trim(),
		accountNumber: String((trainer && trainer.paymentAccountNumber) || "").trim(),
		monthSalary: Number.isFinite(resolvedMonthSalary) ? resolvedMonthSalary : 0,
		payDate: formatDateText(trainer && trainer.payDate),
		status: String((trainer && trainer.paymentStatus) || "Pending").trim() || "Pending",
	};
}

function StatusChip({ status, accent, accentBg }) {
	const normalizedStatus = String(status || "").trim().toLowerCase();
	const isDone = normalizedStatus === "done" || normalizedStatus === "paid";
	return (
		<span
			style={{
				display: "inline-flex",
				alignItems: "center",
				gap: 6,
				fontSize: 12,
				fontWeight: 700,
				color: isDone ? "#166534" : "#991b1b",
				background: isDone ? "#dcfce7" : "#fee2e2",
				border: `1px solid ${isDone ? "#86efac" : "#fca5a5"}`,
				borderRadius: 999,
				padding: "4px 10px",
			}}
		>
			<span
				style={{
					width: 8,
					height: 8,
					borderRadius: "50%",
					background: isDone ? accent : "#ef4444",
					boxShadow: `0 0 0 2px ${accentBg}`,
					display: "inline-block",
				}}
			/>
			{status}
		</span>
	);
}

function DataTable({ title, headers, rows, renderRow, accentBg, getRowStyle }) {
	const handleTableWheel = (event) => {
		const container = event.currentTarget;
		const deltaY = event.deltaY;

		if (!container || !deltaY) {
			return;
		}

		const isScrollingDown = deltaY > 0;
		const isAtTop = container.scrollTop <= 0;
		const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 1;
		const canScrollInside = (isScrollingDown && !isAtBottom) || (!isScrollingDown && !isAtTop);

		if (canScrollInside) {
			event.preventDefault();
			event.stopPropagation();
			container.scrollTop += deltaY;
		}
	};

	return (
		<section
			style={{
				background: "#fff",
				borderRadius: 16,
				border: "1px solid #e5e7eb",
				overflow: "hidden",
			}}
		>
			<div
				style={{
					padding: "14px 16px",
					borderBottom: "1px solid #f1f5f9",
					background: accentBg,
					fontSize: 15,
					fontWeight: 800,
					color: "#0f172a",
				}}
			>
				{title}
			</div>

			<div
				onWheel={handleTableWheel}
				style={{ overflow: "auto", maxHeight: 360 }}
			>
				<table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1120 }}>
					<thead>
						<tr style={{ background: "#f8fafc" }}>
							{headers.map((header) => (
								<th
									key={header}
									style={{
										textAlign: "left",
										fontSize: 12,
										fontWeight: 700,
										color: "#6b7280",
										padding: "12px 16px",
										borderBottom: "1px solid #f1f5f9",
										letterSpacing: 0.3,
										position: "sticky",
										top: 0,
										zIndex: 1,
										background: "#f8fafc",
									}}
								>
									{header}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.map((row, index) => (
							<tr key={index} style={{ height: 52, borderBottom: "1px solid #f8fafc", ...(typeof getRowStyle === "function" ? getRowStyle(row) : {}) }}>
								{renderRow(row)}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</section>
	);
}

export default function Payments({ accent = "#d5f165", accentBg = "#f4fcd9" }) {
	const [activePaymentType, setActivePaymentType] = useState("members");
	const [memberPayments, setMemberPayments] = useState([]);
	const [membersLoading, setMembersLoading] = useState(true);
	const [membersError, setMembersError] = useState("");
	const [trainerPayments, setTrainerPayments] = useState([]);
	const [trainersLoading, setTrainersLoading] = useState(true);
	const [trainersError, setTrainersError] = useState("");
	const [isTrainerPaying, setIsTrainerPaying] = useState("");
	const memberTableHeaders = ["Member ID", "Member Name", "Admission", "Plan", "Amount", "Payment Date", "Due Date", "Status", "Update"];
	const trainerTableHeaders = [
		"Trainer ID",
		"Trainer Name",
		"Role",
		"Bank",
		"Account Number",
		"Month Salary",
		"Pay Date",
		"Status",
		"Action",
	];

	const loadMemberPayments = useCallback(async () => {
		setMembersLoading(true);
		setMembersError("");

		try {
			const token = getToken();
			if (!token) {
				throw new Error("Please sign in again to load members");
			}

			const response = await fetch(`${API_BASE_URL}/api/members`, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(data.message || "Failed to load members for payments");
			}

			const items = Array.isArray(data.items) ? data.items : [];
			const orderedItems = [...items].sort((left, right) => getMemberCreatedAtTime(left) - getMemberCreatedAtTime(right));
			const maleCountRef = { current: 0 };
			const femaleCountRef = { current: 0 };
			const rows = orderedItems.map((member) =>
				normalizeMemberPaymentRow(member, maleCountRef, femaleCountRef)
			);

			setMemberPayments(rows);
		} catch (error) {
			setMembersError(error.message || "Failed to load members for payments");
			setMemberPayments([]);
		} finally {
			setMembersLoading(false);
		}
	}, []);

	useEffect(() => {
		loadMemberPayments();
	}, [loadMemberPayments]);

	const loadTrainerPayments = useCallback(async () => {
		setTrainersLoading(true);
		setTrainersError("");

		try {
			const token = getToken();
			if (!token) {
				throw new Error("Please sign in again to load trainers");
			}

			const response = await fetch(`${API_BASE_URL}/api/trainers`, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(data.message || "Failed to load trainers for payments");
			}

			const items = Array.isArray(data.items) ? data.items : [];
			setTrainerPayments(items.map((item) => normalizeTrainerPaymentRow(item)));
		} catch (error) {
			setTrainersError(error.message || "Failed to load trainers for payments");
			setTrainerPayments([]);
		} finally {
			setTrainersLoading(false);
		}
	}, []);

	useEffect(() => {
		loadTrainerPayments();
	}, [loadTrainerPayments]);

	const handlePlanChange = (memberId, selectedPlan) => {
		const nextAmount = PLAN_PRICE_MAP[selectedPlan] || 0;
		setMemberPayments((prev) =>
			prev.map((row) =>
				row._id === memberId
					? {
						...row,
						plan: selectedPlan,
						amount: nextAmount,
						dueDate: calculateDueDateText(
							row.paymentDate && row.paymentDate !== "-" ? row.paymentDate : new Date(),
							selectedPlan
						),
					}
					: row
			)
		);
	};

	const handleMarkAsPaid = useCallback((memberId) => {
		const todayText = formatDateText(new Date());

		setMemberPayments((prev) =>
			prev.map((row) =>
				row._id === memberId
					? {
						...row,
						paymentDate: todayText,
						dueDate: calculateDueDateText(todayText, row.plan),
						status: "Paid",
					}
					: row
			)
		);
	}, []);

	const maleMemberPayments = useMemo(
		() => memberPayments.filter((item) => String(item.gender || "") !== "female"),
		[memberPayments]
	);

	const femaleMemberPayments = useMemo(
		() => memberPayments.filter((item) => String(item.gender || "") === "female"),
		[memberPayments]
	);

	const maleTrainerPayments = useMemo(
		() => trainerPayments.filter((item) => String(item.gender || "") !== "female"),
		[trainerPayments]
	);

	const femaleTrainerPayments = useMemo(
		() => trainerPayments.filter((item) => String(item.gender || "") === "female"),
		[trainerPayments]
	);

	const handleTrainerFieldChange = useCallback((trainerId, field, value) => {
		setTrainerPayments((prev) =>
			prev.map((row) =>
				row.trainerId === trainerId
					? {
						...row,
						[field]: value,
						...(field === "status" ? {} : { status: "Pending" }),
					}
					: row
			)
		);
	}, []);

	const handleTrainerPay = useCallback(async (trainer) => {
		const trainerId = String((trainer && trainer.trainerId) || "").trim();
		const bank = String((trainer && trainer.bank) || "").trim();
		const accountNumber = String((trainer && trainer.accountNumber) || "").trim();
		const monthSalary = Number((trainer && trainer.monthSalary) || 0);

		if (!bank) {
			setTrainersError("Please select a bank before paying trainer salary");
			return;
		}

		if (!/^\d{6,20}$/.test(accountNumber)) {
			setTrainersError("Account number must be 6 to 20 digits");
			return;
		}

		if (!Number.isFinite(monthSalary) || monthSalary <= 0) {
			setTrainersError("Month salary must be greater than 0");
			return;
		}

		setTrainersError("");
		setIsTrainerPaying(trainerId);

		try {
			const token = getToken();
			if (!token) {
				throw new Error("Please sign in again to continue");
			}

			const response = await fetch(`${API_BASE_URL}/api/trainers/${encodeURIComponent(trainerId)}/pay`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					bank,
					accountNumber,
				}),
			});

			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(data.message || "Failed to pay trainer salary");
			}

			setTrainerPayments((prev) =>
				prev.map((row) =>
					row.trainerId === trainerId
						? normalizeTrainerPaymentRow(data.item || row)
						: row
				)
			);
		} catch (error) {
			setTrainersError(error.message || "Failed to pay trainer salary");
		} finally {
			setIsTrainerPaying("");
		}
	}, []);

	const renderMemberRow = useCallback((item) => (
		<>
			<td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#111827" }}>{item.memberId}</td>
			<td style={{ padding: "12px 16px", fontSize: 13, color: "#1f2937" }}>{item.name}</td>
			<td style={{ padding: "12px 16px" }}><StatusChip status={item.admissionFee} accent={accent} accentBg={accentBg} /></td>
			<td style={{ padding: "12px 16px", fontSize: 13, color: "#1f2937" }}>
				<select
					value={item.plan}
					onChange={(event) => handlePlanChange(item._id, event.target.value)}
					style={{
						border: "1px solid #d1d5db",
						borderRadius: 8,
						padding: "6px 10px",
						fontSize: 12.5,
						fontWeight: 600,
						color: "#0f172a",
						background: "#fff",
					}}
				>
					{PLAN_OPTIONS.map((option) => (
						<option key={option.label} value={option.label}>
							{option.label}
						</option>
					))}
				</select>
			</td>
			<td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#111827" }}>{formatMoney(item.amount)}</td>
			<td style={{ padding: "12px 16px", fontSize: 13, color: "#4b5563" }}>{item.paymentDate}</td>
			<td style={{ padding: "12px 16px", fontSize: 13, color: "#4b5563" }}>{item.dueDate}</td>
			<td style={{ padding: "12px 16px" }}><StatusChip status={item.status} accent={accent} accentBg={accentBg} /></td>
			<td style={{ padding: "12px 16px" }}>
				<button
					type="button"
					onClick={() => handleMarkAsPaid(item._id)}
					disabled={String(item.status || "").toLowerCase() === "paid"}
					style={{
						border: "none",
						borderRadius: 8,
						padding: "6px 10px",
						fontSize: 12,
						fontWeight: 700,
						cursor: String(item.status || "").toLowerCase() === "paid" ? "not-allowed" : "pointer",
						background: String(item.status || "").toLowerCase() === "paid" ? "#dcfce7" : "#1e293b",
						color: String(item.status || "").toLowerCase() === "paid" ? "#166534" : "#ffffff",
						opacity: String(item.status || "").toLowerCase() === "paid" ? 0.9 : 1,
					}}
				>
					{String(item.status || "").toLowerCase() === "paid" ? "Paid" : "Mark as Paid"}
				</button>
			</td>
		</>
	), [accent, accentBg, handleMarkAsPaid]);

	const getMemberRowStyle = useCallback((item) => {
		const isPending = String((item && item.status) || "").trim().toLowerCase() === "pending";
		if (!isPending) {
			return {};
		}

		return {
			animation: "pending-payment-blink 1s ease-in-out infinite",
		};
	}, []);

	const renderTrainerRow = useCallback((item) => (
		<>
			<td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#111827" }}>{item.trainerId}</td>
			<td style={{ padding: "12px 16px", fontSize: 13, color: "#1f2937" }}>{item.name}</td>
			<td style={{ padding: "12px 16px", fontSize: 13, color: "#1f2937" }}>{item.role}</td>
			<td style={{ padding: "12px 16px", minWidth: 170 }}>
				<select
					value={item.bank}
					onChange={(event) => handleTrainerFieldChange(item.trainerId, "bank", event.target.value)}
					style={{
						border: "1px solid #d1d5db",
						borderRadius: 8,
						padding: "6px 10px",
						fontSize: 12.5,
						fontWeight: 600,
						color: "#0f172a",
						background: "#fff",
						width: "100%",
					}}
				>
					<option value="">Select Bank</option>
					{BANK_OPTIONS.map((bank) => (
						<option key={bank} value={bank}>{bank}</option>
					))}
				</select>
			</td>
			<td style={{ padding: "12px 16px", minWidth: 170 }}>
				<input
					type="text"
					value={item.accountNumber}
					onChange={(event) =>
						handleTrainerFieldChange(
							item.trainerId,
							"accountNumber",
							event.target.value.replace(/\D/g, "").slice(0, 20)
						)
					}
					placeholder="Enter account number"
					style={{
						border: "1px solid #d1d5db",
						borderRadius: 8,
						padding: "6px 10px",
						fontSize: 12.5,
						fontWeight: 600,
						color: "#0f172a",
						background: "#fff",
						width: "100%",
					}}
				/>
			</td>
			<td style={{ padding: "12px 16px", minWidth: 150 }}>
				<div
					style={{
						border: "1px solid #d1d5db",
						borderRadius: 8,
						padding: "6px 10px",
						fontSize: 12.5,
						fontWeight: 700,
						color: "#0f172a",
						background: "#f8fafc",
						width: "100%",
					}}
				>
					{formatMoney(item.monthSalary)}
				</div>
			</td>
			<td style={{ padding: "12px 16px", fontSize: 13, color: "#4b5563" }}>{item.payDate}</td>
			<td style={{ padding: "12px 16px" }}><StatusChip status={item.status} accent={accent} accentBg={accentBg} /></td>
			<td style={{ padding: "12px 16px" }}>
				<button
					type="button"
					onClick={() => handleTrainerPay(item)}
					disabled={isTrainerPaying === item.trainerId}
					style={{
						border: "none",
						borderRadius: 8,
						padding: "6px 12px",
						fontSize: 12,
						fontWeight: 700,
						cursor: isTrainerPaying === item.trainerId ? "not-allowed" : "pointer",
						background: "#1e293b",
						color: "#ffffff",
						opacity: isTrainerPaying === item.trainerId ? 0.65 : 1,
					}}
				>
					{isTrainerPaying === item.trainerId ? "Paying..." : "Pay"}
				</button>
			</td>
		</>
	), [accent, accentBg, handleTrainerFieldChange, handleTrainerPay, isTrainerPaying]);

	return (
		<div style={{ display: "grid", gap: 16 }}>
			<style>
				{`@keyframes pending-payment-blink { 0%, 100% { background: #fff7ed; } 50% { background: #ffedd5; } }`}
			</style>
			<div>
				<h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827" }}>Payments</h2>
				<p style={{ margin: "6px 0 0", fontSize: 13, color: "#6b7280" }}>
					Members table now loads registered members with fixed admission and selectable plans.
				</p>
			</div>

			{activePaymentType === "members" && membersError ? (
				<div style={{ background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 12px", fontWeight: 600, fontSize: 13 }}>
					{membersError}
				</div>
			) : null}

			{activePaymentType === "trainers" && trainersError ? (
				<div style={{ background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 12px", fontWeight: 600, fontSize: 13 }}>
					{trainersError}
				</div>
			) : null}

			<div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
				<button
					type="button"
					onClick={() => setActivePaymentType("members")}
					style={{
						padding: "8px 14px",
						borderRadius: 999,
						border: `1px solid ${activePaymentType === "members" ? accent : "#d1d5db"}`,
						background: activePaymentType === "members" ? accent : "#fff",
						color: activePaymentType === "members" ? "#2d3a00" : "#374151",
						fontSize: 12.5,
						fontWeight: 700,
						cursor: "pointer",
						fontFamily: "inherit",
					}}
				>
					Members
				</button>
				<button
					type="button"
					onClick={() => setActivePaymentType("trainers")}
					style={{
						padding: "8px 14px",
						borderRadius: 999,
						border: `1px solid ${activePaymentType === "trainers" ? accent : "#d1d5db"}`,
						background: activePaymentType === "trainers" ? accent : "#fff",
						color: activePaymentType === "trainers" ? "#2d3a00" : "#374151",
						fontSize: 12.5,
						fontWeight: 700,
						cursor: "pointer",
						fontFamily: "inherit",
					}}
				>
					Trainers
				</button>
			</div>

			{activePaymentType === "members" && membersLoading ? (
				<section
					style={{
						background: "#fff",
						borderRadius: 16,
						border: "1px solid #e5e7eb",
						padding: "18px 16px",
						fontWeight: 600,
						color: "#64748b",
					}}
				>
					Loading members payment table...
				</section>
			) : activePaymentType === "members" ? (
				<div style={{ display: "grid", gap: 14 }}>
					<DataTable
						title="Male Members Payment"
						headers={memberTableHeaders}
						rows={maleMemberPayments}
						accentBg={accentBg}
						renderRow={renderMemberRow}
						getRowStyle={getMemberRowStyle}
					/>
					<DataTable
						title="Female Members Payment"
						headers={memberTableHeaders}
						rows={femaleMemberPayments}
						accentBg={accentBg}
						renderRow={renderMemberRow}
						getRowStyle={getMemberRowStyle}
					/>
				</div>
			) : trainersLoading ? (
				<section
					style={{
						background: "#fff",
						borderRadius: 16,
						border: "1px solid #e5e7eb",
						padding: "18px 16px",
						fontWeight: 600,
						color: "#64748b",
					}}
				>
					Loading trainers payment table...
				</section>
			) : (
				<div style={{ display: "grid", gap: 14 }}>
					<DataTable
						title="Male Trainers Payment"
						headers={trainerTableHeaders}
						rows={maleTrainerPayments}
						accentBg={accentBg}
						renderRow={renderTrainerRow}
					/>
					<DataTable
						title="Female Trainers Payment"
						headers={trainerTableHeaders}
						rows={femaleTrainerPayments}
						accentBg={accentBg}
						renderRow={renderTrainerRow}
					/>
				</div>
			)}
		</div>
	);
}
