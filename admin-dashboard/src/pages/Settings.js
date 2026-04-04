import { useCallback, useEffect, useMemo, useState } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const AUTH_TOKEN_KEY = 'ff_admin_token';
const DASHBOARD_THEME_KEY = 'ff_dashboard_theme_mode';
const PANEL_BRIGHTNESS_KEY = 'ff_dashboard_panel_brightness';
const SHOW_MEMBERS_SUMMARY_KEY = 'ff_show_members_summary_cards';
const SHOW_PARTICIPATION_CHART_KEY = 'ff_show_participation_chart';

function readBooleanSetting(key, defaultValue = true) {
	const raw = localStorage.getItem(key);
	if (raw === null) {
		return defaultValue;
	}
	return raw === 'true';
}

function getToken() {
	return localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);
}

function formatDate(value) {
	if (!value) {
		return '-';
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return '-';
	}

	return date.toLocaleString();
}

export default function Settings({
	accent = '#d5f165',
	onPendingCountChange,
	initialSection = 'dashboard-settings',
}) {
	const [items, setItems] = useState([]);
	const [approvedItems, setApprovedItems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [approvedLoading, setApprovedLoading] = useState(true);
	const [actionId, setActionId] = useState('');
	const [approvedActionId, setApprovedActionId] = useState('');
	const [error, setError] = useState('');
	const [notice, setNotice] = useState('');
	const [selectedSection, setSelectedSection] = useState(initialSection);
	const [themeMode, setThemeMode] = useState(() => {
		const savedTheme = localStorage.getItem(DASHBOARD_THEME_KEY);
		return savedTheme === 'dark' ? 'dark' : 'light';
	});
	const [panelBrightness, setPanelBrightness] = useState(() => {
		const savedBrightness = Number(localStorage.getItem(PANEL_BRIGHTNESS_KEY));
		if (Number.isFinite(savedBrightness) && savedBrightness >= 70 && savedBrightness <= 130) {
			return savedBrightness;
		}
		return 100;
	});
	const [showMembersSummaryCards, setShowMembersSummaryCards] = useState(() =>
		readBooleanSetting(SHOW_MEMBERS_SUMMARY_KEY, true)
	);
	const [showParticipationChart, setShowParticipationChart] = useState(() =>
		readBooleanSetting(SHOW_PARTICIPATION_CHART_KEY, true)
	);

	const pendingCount = useMemo(() => items.length, [items]);

	const loadPendingRequests = useCallback(async () => {
		setLoading(true);
		setError('');

		try {
			const token = getToken();
			const response = await fetch(`${API_BASE_URL}/api/access-requests/pending`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(data.message || 'Failed to load pending requests');
			}

			setItems(Array.isArray(data.items) ? data.items : []);
		} catch (loadError) {
			setError(loadError.message || 'Failed to load pending requests');
		} finally {
			setLoading(false);
		}
	}, []);

	const loadApprovedRequests = useCallback(async () => {
		setApprovedLoading(true);
		setError('');

		try {
			const token = getToken();
			const response = await fetch(`${API_BASE_URL}/api/access-requests/approved`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(data.message || 'Failed to load approved requests');
			}

			setApprovedItems(Array.isArray(data.items) ? data.items : []);
		} catch (loadError) {
			setError(loadError.message || 'Failed to load approved requests');
		} finally {
			setApprovedLoading(false);
		}
	}, []);

	useEffect(() => {
		setSelectedSection(initialSection);
	}, [initialSection]);

	useEffect(() => {
		if (selectedSection === 'new-access') {
			loadPendingRequests();
			loadApprovedRequests();
		}
	}, [loadApprovedRequests, loadPendingRequests, selectedSection]);

	useEffect(() => {
		if (typeof onPendingCountChange === 'function') {
			onPendingCountChange(pendingCount);
		}
	}, [onPendingCountChange, pendingCount]);

	useEffect(() => {
		let styleElement = document.getElementById('ff-dashboard-theme-style');
		if (!styleElement) {
			styleElement = document.createElement('style');
			styleElement.id = 'ff-dashboard-theme-style';
			styleElement.textContent = `
:root {
	--ff-panel-brightness: 100%;
}

.card,
aside,
.sidebar-drawer,
.right-drawer {
	filter: brightness(var(--ff-panel-brightness));
	transition: filter 0.2s ease;
}

:root[data-ff-theme='dark'] body {
	background: #0b1220 !important;
	color: #e2e8f0 !important;
}

:root[data-ff-theme='dark'] .card,
:root[data-ff-theme='dark'] aside,
:root[data-ff-theme='dark'] .sidebar-drawer,
:root[data-ff-theme='dark'] .right-drawer {
	background: #111827 !important;
	border-color: #334155 !important;
	color: #e2e8f0 !important;
}

:root[data-ff-theme='dark'] .nav-link {
	color: #cbd5e1 !important;
}

:root[data-ff-theme='dark'] .nav-link:hover {
	background: #1f2937 !important;
	color: #e2e8f0 !important;
}
			`;
			document.head.appendChild(styleElement);
		}

		document.documentElement.setAttribute('data-ff-theme', themeMode);
		document.documentElement.style.setProperty('--ff-panel-brightness', `${panelBrightness}%`);
		localStorage.setItem(DASHBOARD_THEME_KEY, themeMode);
		localStorage.setItem(PANEL_BRIGHTNESS_KEY, String(panelBrightness));
	}, [themeMode, panelBrightness]);

	useEffect(() => {
		localStorage.setItem(SHOW_MEMBERS_SUMMARY_KEY, String(showMembersSummaryCards));
	}, [showMembersSummaryCards]);

	useEffect(() => {
		localStorage.setItem(SHOW_PARTICIPATION_CHART_KEY, String(showParticipationChart));
	}, [showParticipationChart]);

	const handleReview = async (requestId, action) => {
		setActionId(requestId);
		setError('');
		setNotice('');

		try {
			const token = getToken();
			let reason = '';

			if (action === 'reject') {
				reason = window.prompt('Optional reject reason:', '') || '';
			}

			const response = await fetch(`${API_BASE_URL}/api/access-requests/${requestId}/review`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ action, reason }),
			});

			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(data.message || 'Failed to update request status');
			}

			setItems((prev) => prev.filter((item) => item._id !== requestId));
			if (action === 'approve') {
				loadApprovedRequests();
			}
			const baseMessage = data.message || `Request ${action}d successfully`;
			if (data.emailSent === false) {
				const emailStatusTextByCode = {
					'smtp-not-configured': 'SMTP not configured',
					'mail-disabled': 'Email notifications disabled',
					'smtp-auth-failed': 'SMTP auth failed (check email/password)',
					'smtp-app-password-required': 'Gmail app password required',
					'send-failed': 'Email send failed',
				};

				setNotice(
					`${baseMessage}. Email was not sent (${emailStatusTextByCode[data.emailStatus] || 'unknown reason'}).`
				);
			} else {
				setNotice(baseMessage);
			}
		} catch (reviewError) {
			setError(reviewError.message || 'Failed to update request status');
		} finally {
			setActionId('');
		}
	};

	const handleDeleteApproved = async (requestId) => {
		if (!requestId) {
			return;
		}

		const shouldDelete = window.confirm(
			'Are you sure you want to delete this approved access? This will disable that admin account.'
		);
		if (!shouldDelete) {
			return;
		}

		setApprovedActionId(requestId);
		setError('');
		setNotice('');

		try {
			const token = getToken();
			const response = await fetch(`${API_BASE_URL}/api/access-requests/approved/${requestId}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(data.message || 'Failed to delete approved access');
			}

			setApprovedItems((prev) => prev.filter((item) => item._id !== requestId));
			setNotice(data.message || 'Approved access removed successfully');
		} catch (deleteError) {
			setError(deleteError.message || 'Failed to delete approved access');
		} finally {
			setApprovedActionId('');
		}
	};

	const isNewAccessSection = selectedSection === 'new-access';
	const isDashboardSection = selectedSection === 'dashboard-settings' || selectedSection === 'overview';
	const isDarkMode = themeMode === 'dark';

	return (
		<div
			style={{
				background: '#fff',
				borderRadius: 20,
				boxShadow: '0 3px 12px rgba(15,23,42,0.07)',
				padding: '20px 22px',
			}}
		>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
				{/* <div>
					<h2 style={{ margin: 0, fontSize: 20, color: '#111827' }}>Settings</h2>
					<p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: 13 }}>
						Manage dashboard preferences and access-related requests.
					</p>
				</div> */}

				<div style={{ display: 'flex', gap: 8 }}>
					{/* <button
						onClick={() => setSelectedSection('overview')}
						style={{
							border: 'none',
							borderRadius: 10,
							padding: '9px 12px',
							fontWeight: 700,
							cursor: 'pointer',
							background: selectedSection === 'overview' ? accent : '#f1f5f9',
							color: selectedSection === 'overview' ? '#2d3a00' : '#334155',
						}}
					>
						Overview
					</button> */}
					{/* <button
						onClick={() => setSelectedSection('new-access')}
						style={{
							border: 'none',
							borderRadius: 10,
							padding: '9px 12px',
							fontWeight: 700,
							cursor: 'pointer',
							background: selectedSection === 'new-access' ? accent : '#f1f5f9',
							color: selectedSection === 'new-access' ? '#2d3a00' : '#334155',
						}}
					>
						New Access
					</button> */}
				</div>
			</div>

			{isDashboardSection ? (
				<div
					style={{
						marginTop: 18,
						background: '#f8fafc',
						border: '1px solid #e2e8f0',
						borderRadius: 12,
						padding: '18px',
					}}
				>
					<h3 style={{ margin: 0, fontSize: 17, color: '#111827' }}>Dashboard Setting</h3>
					<p style={{ margin: '8px 0 14px', color: '#64748b', fontSize: 13 }}>
						Manage what should appear in your dashboard home view.
					</p>

					<div style={{ display: 'grid', gap: 10 }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px', gap: 12, flexWrap: 'wrap' }}>
							<div>
								<div style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>Dark Mode / Light Mode</div>
								<div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Toggle dashboard theme mode</div>
							</div>
							<button
								type='button'
								onClick={() => setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'))}
								style={{
									border: 'none',
									borderRadius: 999,
									padding: '8px 12px',
									background: isDarkMode ? '#111827' : accent,
									color: isDarkMode ? '#f8fafc' : '#2d3a00',
									fontWeight: 700,
									cursor: 'pointer',
								}}
							>
								{isDarkMode ? 'Dark Mode On' : 'Light Mode On'}
							</button>
						</div>

						<div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px' }}>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 10, flexWrap: 'wrap' }}>
								<div>
									<div style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>Panel Brightness</div>
									<div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Adjust dashboard panel brightness</div>
								</div>
								<span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{panelBrightness}%</span>
							</div>
							<input
								type='range'
								min={70}
								max={130}
								value={panelBrightness}
								onChange={(event) => setPanelBrightness(Number(event.target.value))}
								style={{ width: '100%', accentColor: accent }}
							/>
						</div>

						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px' }}>
							<div>
								<div style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>Members Summary Cards</div>
								<div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Show or hide members cards in dashboard</div>
							</div>
							<button
								type='button'
								onClick={() => setShowMembersSummaryCards((prev) => !prev)}
								style={{
									border: 'none',
									borderRadius: 999,
									padding: '8px 12px',
									background: showMembersSummaryCards ? '#16a34a' : '#ef4444',
									color: '#fff',
									fontWeight: 700,
									cursor: 'pointer',
									fontSize: 12,
								}}
							>
								{showMembersSummaryCards ? 'Enabled' : 'Disabled'}
							</button>
						</div>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px' }}>
							<div>
								<div style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>Participation Chart</div>
								<div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Show or hide monthly participation chart</div>
							</div>
							<button
								type='button'
								onClick={() => setShowParticipationChart((prev) => !prev)}
								style={{
									border: 'none',
									borderRadius: 999,
									padding: '8px 12px',
									background: showParticipationChart ? '#16a34a' : '#ef4444',
									color: '#fff',
									fontWeight: 700,
									cursor: 'pointer',
									fontSize: 12,
								}}
							>
								{showParticipationChart ? 'Enabled' : 'Disabled'}
							</button>
						</div>
					</div>
				</div>
			) : null}

			{!isNewAccessSection && !isDashboardSection ? (
				<div
					style={{
						marginTop: 18,
						background: '#f8fafc',
						border: '1px dashed #cbd5e1',
						borderRadius: 12,
						padding: '18px',
						color: '#64748b',
						fontSize: 13,
					}}
				>
					Select <strong>New Access</strong> to view and manage pending access requests.
				</div>
			) : null}

			{isNewAccessSection ? (
				<div style={{ marginTop: 18 }}>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<div>
							<h3 style={{ margin: 0, fontSize: 18, color: '#111827' }}>Pending Access Requests</h3>
							<p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: 13 }}>
								New user requests stay here until approved or rejected.
							</p>
						</div>

						<button
							onClick={loadPendingRequests}
							style={{
								background: accent,
								border: 'none',
								borderRadius: 10,
								padding: '9px 14px',
								fontWeight: 700,
								cursor: 'pointer',
								color: '#2d3a00',
							}}
						>
							Refresh
						</button>
					</div>

					{notice ? (
						<div
							style={{
								marginTop: 14,
								background: '#ecfdf3',
								border: '1px solid #bbf7d0',
								color: '#166534',
								padding: '10px 12px',
								borderRadius: 10,
								fontSize: 13,
							}}
						>
							{notice}
						</div>
					) : null}

					{error ? (
						<div
							style={{
								marginTop: 14,
								background: '#fef2f2',
								border: '1px solid #fecaca',
								color: '#991b1b',
								padding: '10px 12px',
								borderRadius: 10,
								fontSize: 13,
							}}
						>
							{error}
						</div>
					) : null}

					<div style={{ marginTop: 18 }}>
						{loading ? (
							<div style={{ padding: '14px 0', color: '#6b7280', fontSize: 13 }}>Loading requests...</div>
						) : null}

						{!loading && items.length === 0 ? (
							<div
								style={{
									background: '#f8fafc',
									border: '1px dashed #cbd5e1',
									borderRadius: 12,
									padding: '18px',
									color: '#64748b',
									fontSize: 13,
								}}
							>
								No pending requests right now.
							</div>
						) : null}

						{!loading && items.length > 0 ? (
							<div style={{ display: 'grid', gap: 10 }}>
								{items.map((item) => {
									const isBusy = actionId === item._id;

									return (
										<div
											key={item._id}
											style={{
												border: '1px solid #e5e7eb',
												borderRadius: 12,
												padding: '14px 12px',
												display: 'flex',
												justifyContent: 'space-between',
												gap: 12,
												alignItems: 'center',
												flexWrap: 'wrap',
											}}
										>
											<div>
												<div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
													{item.userName}
												</div>
												<div style={{ fontSize: 13, color: '#4b5563', marginTop: 2 }}>{item.email}</div>
												<div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
													Requested: {formatDate(item.createdAt)}
												</div>
											</div>

											<div style={{ display: 'flex', gap: 8 }}>
												<button
													onClick={() => handleReview(item._id, 'approve')}
													disabled={isBusy}
													style={{
														border: 'none',
														borderRadius: 10,
														padding: '9px 12px',
														background: '#16a34a',
														color: '#fff',
														fontWeight: 700,
														cursor: isBusy ? 'not-allowed' : 'pointer',
														opacity: isBusy ? 0.7 : 1,
													}}
												>
													Approve
												</button>

												<button
													onClick={() => handleReview(item._id, 'reject')}
													disabled={isBusy}
													style={{
														border: 'none',
														borderRadius: 10,
														padding: '9px 12px',
														background: '#ef4444',
														color: '#fff',
														fontWeight: 700,
														cursor: isBusy ? 'not-allowed' : 'pointer',
														opacity: isBusy ? 0.7 : 1,
													}}
												>
													Reject
												</button>
											</div>
										</div>
									);
								})}
							</div>
						) : null}
					</div>

					<div style={{ marginTop: 28 }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<div>
								<h3 style={{ margin: 0, fontSize: 18, color: '#111827' }}>Approved Access Users</h3>
								<p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: 13 }}>
									View who has been confirmed and remove access if needed.
								</p>
							</div>

							<button
								onClick={loadApprovedRequests}
								style={{
									background: '#f1f5f9',
									border: '1px solid #d1d5db',
									borderRadius: 10,
									padding: '9px 14px',
									fontWeight: 700,
									cursor: 'pointer',
									color: '#334155',
								}}
							>
								Refresh Approved
							</button>
						</div>

						{approvedLoading ? (
							<div style={{ padding: '14px 0', color: '#6b7280', fontSize: 13 }}>
								Loading approved users...
							</div>
						) : null}

						{!approvedLoading && approvedItems.length === 0 ? (
							<div
								style={{
									background: '#f8fafc',
									border: '1px dashed #cbd5e1',
									borderRadius: 12,
									padding: '18px',
									color: '#64748b',
									fontSize: 13,
								}}
							>
								No approved access users yet.
							</div>
						) : null}

						{!approvedLoading && approvedItems.length > 0 ? (
							<div style={{ display: 'grid', gap: 10 }}>
								{approvedItems.map((item) => {
									const isBusy = approvedActionId === item._id;

									return (
										<div
											key={item._id}
											style={{
												border: '1px solid #e5e7eb',
												borderRadius: 12,
												padding: '14px 12px',
												display: 'flex',
												justifyContent: 'space-between',
												gap: 12,
												alignItems: 'center',
												flexWrap: 'wrap',
											}}
										>
											<div>
												<div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
													{item.userName}
												</div>
												<div style={{ fontSize: 13, color: '#4b5563', marginTop: 2 }}>{item.email}</div>
												<div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
													Approved By: {item.reviewedBy || '-'}
												</div>
												<div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
													Approved At: {formatDate(item.reviewedAt)}
												</div>
											</div>

											<button
												onClick={() => handleDeleteApproved(item._id)}
												disabled={isBusy}
												style={{
													border: 'none',
													borderRadius: 10,
													padding: '9px 12px',
													background: '#ef4444',
													color: '#fff',
													fontWeight: 700,
													cursor: isBusy ? 'not-allowed' : 'pointer',
													opacity: isBusy ? 0.7 : 1,
												}}
											>
												{isBusy ? 'Deleting...' : 'Delete'}
											</button>
										</div>
									);
								})}
							</div>
						) : null}
					</div>
				</div>
			) : null}
		</div>
	);
}
