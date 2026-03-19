import React, { useState } from "react";
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from "@mui/icons-material/People";
import MaleIcon from '@mui/icons-material/Male';
import FemaleIcon from "@mui/icons-material/Female";
import logoImage from "../assets/images/logo.png";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import PaymentIcon from "@mui/icons-material/Payment";
import AssignmentIcon from "@mui/icons-material/Assignment";
import TimelineIcon from "@mui/icons-material/Timeline";
import SummarizeIcon from "@mui/icons-material/Summarize";
import SettingsIcon from "@mui/icons-material/Settings";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export default function Navbar({
	activeNav,
	setActiveNav,
	isDesktop,
	sidebarOpen,
	setSidebarOpen,
	accent,
	onLogout,
}) {
	const [expandedMenus, setExpandedMenus] = useState({});

	const toggleMenu = (menuId) => {
		setExpandedMenus((prev) => ({
			...prev,
			[menuId]: !prev[menuId],
		}));
	};

	const navItems = [
		{ id: "dashboard", label: "Dashboard", icon: DashboardIcon },
		{
			id: "members",
			label: "Members",
			icon: PeopleIcon,
			submenu: [
				{ id: "male", label: "Male", icon: MaleIcon },
				{ id: "female", label: "Female", icon: FemaleIcon },
			],
		},
		{
			id: "trainers",
			label: "Trainers",
			icon: FitnessCenterIcon,
			submenu: [
				{ id: "trainers-male", label: "Male", icon: MaleIcon },
				{ id: "trainers-female", label: "Female", icon: FemaleIcon },
			],
		},
		{ id: "payment", label: "Payment", icon: PaymentIcon },
		{
			id: "reports",
			label: "Reports",
			icon: AssignmentIcon,
			submenu: [
				{ id: "performance", label: "Performance", icon: TimelineIcon },
				{ id: "summary", label: "Summary", icon: SummarizeIcon },
			],
		},
		{ id: "settings", label: "Settings", icon: SettingsIcon },
	];

	return (
		<aside
			className={!isDesktop ? `sidebar-drawer${sidebarOpen ? " open" : ""}` : ""}
			style={{
				width: 200,
				background: "#fff",
				padding: "24px 14px 20px",
				display: "flex",
				flexDirection: "column",
				flexShrink: 0,
				borderRight: "1px solid #f0f0f0",
				...(isDesktop ? { height: "100%", position: "relative" } : {}),
			}}
		>
			<div style={{ display: "flex", alignItems: "center", marginBottom: 32, paddingLeft: 4 }}>
				<img
					src={logoImage}
					alt="Logo"
					style={{ width: 100, height: "auto", objectFit: "contain" }}
				/>
			</div>

			<nav style={{ flex: 1 }}>
			{navItems.map((item) => {
				const IconComponent = item.icon;
				const isExpanded = expandedMenus[item.id];
				const hasSubmenu = item.submenu && item.submenu.length > 0;

				return (
					<div key={item.id}>
						<button
							className={`nav-link${activeNav === item.id ? " on" : ""}`}
							onClick={() => {
								if (hasSubmenu) {
									toggleMenu(item.id);
								} else {
									setActiveNav(item.id);
									if (!isDesktop) {
										setSidebarOpen(false);
									}
								}
							}}
							style={{
								display: "flex",
								alignItems: "center",
								gap: "12px",
								justifyContent: "space-between",
							}}
						>
							<span style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
								<IconComponent sx={{ fontSize: 20 }} />
								{item.label}
							</span>
							{hasSubmenu && (isExpanded ? <ExpandLessIcon sx={{ fontSize: 18 }} /> : <ExpandMoreIcon sx={{ fontSize: 18 }} />)}
						</button>

						{hasSubmenu && isExpanded && (
							<div style={{ paddingLeft: "20px" }}>
								{item.submenu.map((subitem) => {
									const SubIconComponent = subitem.icon;
									return (
										<button
											key={subitem.id}
											className={`nav-link${activeNav === subitem.id ? " on" : ""}`}
											onClick={() => {
												setActiveNav(subitem.id);
												if (!isDesktop) {
													setSidebarOpen(false);
												}
											}}
											style={{
												display: "flex",
												alignItems: "center",
												gap: "12px",
												fontSize: "14px",
											}}
										>
											<SubIconComponent sx={{ fontSize: 18 }} />
											{subitem.label}
										</button>
									);
								})}
							</div>
						)}
					</div>
				);
			})}
			</nav>

			<button
				onClick={() => {
					if (typeof onLogout === "function") {
						onLogout();
					}
				}}
				style={{
					background: accent,
					border: "none",
					borderRadius: 12,
					padding: "12px 14px",
					textAlign: "center",
					fontSize: 13,
					fontWeight: 800,
					color: "#2d3a00",
					cursor: "pointer",
					fontFamily: "inherit",
				}}
			>
				Logout
			</button>
		</aside>
	);
}
