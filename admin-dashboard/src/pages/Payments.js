import React, { useMemo, useState } from "react";

const MEMBER_PAYMENTS = [
	{
		memberId: "M-102",
		name: "Nimal Perera",
		admissionFee: "Done",
		plan: "Monthly",
		amount: "LKR 5,500",
		paymentDate: "2026-03-02",
		paymentDueDate: "2026-03-12",
		status: "Done",
	},
	{
		memberId: "M-118",
		name: "Kamal Silva",
		admissionFee: "Pending",
		plan: "Quarterly",
		amount: "LKR 14,000",
		paymentDate: "2026-03-10",
		paymentDueDate: "2026-03-18",
		status: "Pending",
	},
	{
		memberId: "M-133",
		name: "Rashmi Fernando",
		admissionFee: "Done",
		plan: "Yearly",
		amount: "LKR 6,000",
		paymentDate: "2026-03-19",
		paymentDueDate: "2026-03-24",
		status: "Done",
	},
];

const TRAINER_PAYMENTS = [
	{
		trainerId: "T-021",
		name: "Amila Jayasuriya",
		role: "Strength Coach",
		monthSalary: "LKR 45,000",
		payDate: "2026-03-11",
		status: "Done",
	},
	{
		trainerId: "T-027",
		name: "Dinithi Perera",
		role: "Yoga Instructor",
		monthSalary: "LKR 38,000",
		payDate: "2026-03-20",
		status: "Pending",
	},
	{
		trainerId: "T-033",
		name: "Sandeep Raj",
		role: "Cardio Trainer",
		monthSalary: "LKR 41,000",
		payDate: "2026-03-25",
		status: "Done",
	},
];

function StatusChip({ status, accent, accentBg }) {
	const normalizedStatus = String(status || "").trim().toLowerCase();
	const isDone = normalizedStatus === "done";
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

function DataTable({ title, headers, rows, renderRow, accentBg }) {
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

			<div style={{ overflowX: "auto" }}>
				<table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
					<thead>
						<tr>
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
									}}
								>
									{header}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.map((row, index) => (
							<tr key={index} style={{ borderBottom: "1px solid #f8fafc" }}>
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

	const activeConfig = useMemo(() => {
		if (activePaymentType === "trainers") {
			return {
				title: "Trainers Payment",
				headers: ["Trainer ID", "Trainer Name", "Role", "Month Salary", "Pay Date", "Status"],
				rows: TRAINER_PAYMENTS,
				renderRow: (item) => (
					<>
						<td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#111827" }}>{item.trainerId}</td>
						<td style={{ padding: "12px 16px", fontSize: 13, color: "#1f2937" }}>{item.name}</td>
						<td style={{ padding: "12px 16px", fontSize: 13, color: "#1f2937" }}>{item.role}</td>
						<td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#111827" }}>{item.monthSalary}</td>
						<td style={{ padding: "12px 16px", fontSize: 13, color: "#4b5563" }}>{item.payDate}</td>
						<td style={{ padding: "12px 16px" }}><StatusChip status={item.status} accent={accent} accentBg={accentBg} /></td>
					</>
				),
			};
		}

		return {
			title: "Members Payment",
			headers: ["Member ID", "Member Name", "Admition Fee", "Plan", "Amount", "Payment Date", "Payment Due Date", "Status"],
			rows: MEMBER_PAYMENTS,
			renderRow: (item) => (
				<>
					<td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#111827" }}>{item.memberId}</td>
					<td style={{ padding: "12px 16px", fontSize: 13, color: "#1f2937" }}>{item.name}</td>
					<td style={{ padding: "12px 16px" }}><StatusChip status={item.admissionFee} accent={accent} accentBg={accentBg} /></td>
					<td style={{ padding: "12px 16px", fontSize: 13, color: "#1f2937" }}>{item.plan}</td>
					<td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#111827" }}>{item.amount}</td>
					<td style={{ padding: "12px 16px", fontSize: 13, color: "#4b5563" }}>{item.paymentDate}</td>
					<td style={{ padding: "12px 16px", fontSize: 13, color: "#4b5563" }}>{item.paymentDueDate}</td>
					<td style={{ padding: "12px 16px" }}><StatusChip status={item.status} accent={accent} accentBg={accentBg} /></td>
				</>
			),
		};
	}, [activePaymentType, accent, accentBg]);

	return (
		<div style={{ display: "grid", gap: 16 }}>
			<div>
				<h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827" }}>Payments</h2>
				<p style={{ margin: "6px 0 0", fontSize: 13, color: "#6b7280" }}>
					Select Members or Trainers to view the relevant payment table.
				</p>
			</div>

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

			<DataTable
				title={activeConfig.title}
				headers={activeConfig.headers}
				rows={activeConfig.rows}
				accentBg={accentBg}
				renderRow={activeConfig.renderRow}
			/>
		</div>
	);
}
