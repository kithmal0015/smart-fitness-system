import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SearchIcon from '@mui/icons-material/Search';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import "../styles/Members.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const AUTH_TOKEN_KEY = 'ff_admin_token';
const initialEditForm = {
	firstName: '',
	lastName: '',
	email: '',
	gender: 'Male',
	dob: '',
	profileImage: '',
};

const initialAddForm = {
	firstName: '',
	lastName: '',
	email: '',
	gender: 'Male',
	dob: '',
	password: '',
	confirmPassword: '',
	profileImage: '',
};

function getToken() {
	return localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);
}

function calculateAgeFromDob(dobValue) {
	if (!dobValue) {
		return '';
	}

	const dobDate = new Date(dobValue);
	if (Number.isNaN(dobDate.getTime())) {
		return '';
	}

	const today = new Date();
	let age = today.getFullYear() - dobDate.getFullYear();
	const monthDiff = today.getMonth() - dobDate.getMonth();
	const hasNotHadBirthday = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate());

	if (hasNotHadBirthday) {
		age -= 1;
	}

	return age >= 0 ? age : '';
}

function normalizeMember(item) {
	const gender = String((item && item.gender) || '').trim();
	const dob = (item && item.dob) || null;
	const safeAge =
		typeof item.age === 'number' && Number.isFinite(item.age)
			? item.age
			: calculateAgeFromDob(dob);

	return {
		_id: String((item && item._id) || ''),
		id: String((item && item.id) || '').trim(),
		firstName: String((item && item.firstName) || '').trim(),
		lastName: String((item && item.lastName) || '').trim(),
		email: String((item && item.email) || '').trim(),
		gender,
		age: safeAge,
		dob,
		createdAt: (item && item.createdAt) || null,
		status: String((item && item.status) || 'Active'),
		profileImage: String((item && item.profileImage) || 'https://via.placeholder.com/40'),
	};
}

function getCreatedAtTime(member) {
	const raw = member && member.createdAt ? member.createdAt : null;
	const time = new Date(raw || 0).getTime();
	return Number.isFinite(time) ? time : 0;
}

function formatDobForInput(dobValue) {
	if (!dobValue) {
		return '';
	}

	const date = new Date(dobValue);
	if (Number.isNaN(date.getTime())) {
		return '';
	}

	return date.toISOString().slice(0, 10);
}

function readFileAsDataUrl(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result || ''));
		reader.onerror = () => reject(new Error('Failed to read image file'));
		reader.readAsDataURL(file);
	});
}

export default function Members({ accent, activeNav, focusedMemberId = '' }) {
	const [maleSearchQuery, setMaleSearchQuery] = useState("");
	const [femaleSearchQuery, setFemaleSearchQuery] = useState("");
	const [members, setMembers] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState('');
	const [noticeMessage, setNoticeMessage] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [selectedMember, setSelectedMember] = useState(null);
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [addFormData, setAddFormData] = useState(initialAddForm);
	const [isViewModalOpen, setIsViewModalOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [editFormData, setEditFormData] = useState(initialEditForm);
	const addMemberImageInputRef = useRef(null);
	const memberImageInputRef = useRef(null);

	const loadMembers = useCallback(async () => {
		setIsLoading(true);
		setErrorMessage('');

		try {
			const token = getToken();
			if (!token) {
				throw new Error('Please sign in again to load members');
			}

			const response = await fetch(`${API_BASE_URL}/api/members`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(data.message || 'Failed to load members');
			}

			const normalizedMembers = Array.isArray(data.items)
				? data.items.map(normalizeMember)
				: [];

			setMembers(normalizedMembers);
		} catch (error) {
			setErrorMessage(error.message || 'Failed to load members');
			setMembers([]);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadMembers();
	}, [loadMembers]);

	const maleMembers = useMemo(() => {
		const maleRows = members
			.filter(
			(member) => String(member.gender || '').toLowerCase() === 'male'
		)
			.sort((left, right) => getCreatedAtTime(left) - getCreatedAtTime(right));

		return maleRows.map((member, index) => ({
			...member,
			id: member.id || `M-${String(index + 1).padStart(3, '0')}`,
		}));
	}, [members]);

	const femaleMembers = useMemo(() => {
		const femaleRows = members
			.filter(
			(member) => String(member.gender || '').toLowerCase() === 'female'
		)
			.sort((left, right) => getCreatedAtTime(left) - getCreatedAtTime(right));

		return femaleRows.map((member, index) => ({
			...member,
			id: member.id || `F-${String(index + 1).padStart(3, '0')}`,
		}));
	}, [members]);

	const focusedMember = useMemo(() => {
		const targetId = String(focusedMemberId || '').trim();
		if (!targetId) {
			return null;
		}

		return members.find((member) => String(member._id || '').trim() === targetId) || null;
	}, [focusedMemberId, members]);

	const filteredMaleMembers = useMemo(() => {
		if (!focusedMember) {
			return maleMembers;
		}

		if (String(focusedMember.gender || '').toLowerCase() !== 'male') {
			return [];
		}

		const selected = maleMembers.find((member) => member._id === focusedMember._id);
		return selected ? [selected] : [];
	}, [focusedMember, maleMembers]);

	const filteredFemaleMembers = useMemo(() => {
		if (!focusedMember) {
			return femaleMembers;
		}

		if (String(focusedMember.gender || '').toLowerCase() !== 'female') {
			return [];
		}

		const selected = femaleMembers.find((member) => member._id === focusedMember._id);
		return selected ? [selected] : [];
	}, [focusedMember, femaleMembers]);

	// Determine which table to show based on activeNav
	const isMaleOnly = activeNav === "male";
	const isFemaleOnly = activeNav === "female";
	const showBothTables = activeNav === "members" || !activeNav;

	const handleView = async (memberId) => {
		setErrorMessage('');

		try {
			const token = getToken();
			if (!token) {
				throw new Error('Please sign in again to continue');
			}

			const response = await fetch(`${API_BASE_URL}/api/members/${encodeURIComponent(memberId)}`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(data.message || 'Failed to load member details');
			}

			const member = normalizeMember(data.item || {});
			setSelectedMember(member);
			setIsViewModalOpen(true);
		} catch (error) {
			setErrorMessage(error.message || 'Failed to load member details');
		}
	};

	const handleUpdate = (memberId) => {
		const member = members.find((item) => item._id === memberId);
		if (!member) {
			setErrorMessage('Member details are not available');
			return;
		}

		setErrorMessage('');
		setNoticeMessage('');
		setSelectedMember(member);
		setEditFormData({
			firstName: member.firstName,
			lastName: member.lastName,
			email: member.email,
			gender: member.gender === 'Female' ? 'Female' : 'Male',
			dob: formatDobForInput(member.dob),
			profileImage: member.profileImage,
		});
		setIsEditModalOpen(true);
	};

	const handleDelete = async (memberId) => {
		const member = members.find((item) => item._id === memberId);
		if (!member) {
			setErrorMessage('Member details are not available');
			return;
		}

		const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim();
		const confirmed = window.confirm(`Delete member ${fullName || member.email}? This action cannot be undone.`);
		if (!confirmed) {
			return;
		}

		setErrorMessage('');
		setNoticeMessage('');

		try {
			const token = getToken();
			if (!token) {
				throw new Error('Please sign in again to continue');
			}

			const response = await fetch(`${API_BASE_URL}/api/members/${encodeURIComponent(member._id)}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(data.message || 'Failed to delete member');
			}

			setMembers((prev) => prev.filter((item) => item._id !== member._id));
			setNoticeMessage(data.message || 'Member deleted successfully');
		} catch (error) {
			setErrorMessage(error.message || 'Failed to delete member');
		}
	};

	const closeAddModal = () => {
		setIsAddModalOpen(false);
		setIsSubmitting(false);
	};

	const handleAddMember = () => {
		setErrorMessage('');
		setNoticeMessage('');
		setAddFormData(initialAddForm);
		setIsAddModalOpen(true);
	};

	const handleAddFieldChange = (field, value) => {
		setAddFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleSelectAddProfileImage = () => {
		if (addMemberImageInputRef.current) {
			addMemberImageInputRef.current.click();
		}
	};

	const handleAddProfileImageSelected = async (event) => {
		const file = event.target.files && event.target.files[0];
		if (!file) {
			return;
		}

		try {
			const dataUrl = await readFileAsDataUrl(file);
			handleAddFieldChange('profileImage', dataUrl);
		} catch (error) {
			setErrorMessage(error.message || 'Failed to read selected image');
		}

		event.target.value = '';
	};

	const handleSubmitAddMember = async (event) => {
		event.preventDefault();

		if (addFormData.password !== addFormData.confirmPassword) {
			setErrorMessage('Passwords do not match');
			return;
		}

		setErrorMessage('');
		setNoticeMessage('');
		setIsSubmitting(true);

		try {
			const token = getToken();
			if (!token) {
				throw new Error('Please sign in again to continue');
			}

			const response = await fetch(`${API_BASE_URL}/api/members`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					firstName: addFormData.firstName,
					lastName: addFormData.lastName,
					email: addFormData.email,
					gender: addFormData.gender,
					dob: addFormData.dob,
					password: addFormData.password,
					profileImage: addFormData.profileImage,
				}),
			});

			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(data.message || 'Failed to add member');
			}

			const createdMember = normalizeMember(data.item || {});
			setMembers((prev) => [createdMember, ...prev]);
			setNoticeMessage(data.message || 'Member added successfully');
			closeAddModal();
		} catch (error) {
			setErrorMessage(error.message || 'Failed to add member');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleEditFieldChange = (field, value) => {
		setEditFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const closeEditModal = () => {
		setIsEditModalOpen(false);
		setIsSubmitting(false);
	};

	const handleSelectProfileImage = () => {
		if (memberImageInputRef.current) {
			memberImageInputRef.current.click();
		}
	};

	const handleProfileImageSelected = async (event) => {
		const file = event.target.files && event.target.files[0];
		if (!file) {
			return;
		}

		try {
			const dataUrl = await readFileAsDataUrl(file);
			handleEditFieldChange('profileImage', dataUrl);
		} catch (error) {
			setErrorMessage(error.message || 'Failed to read selected image');
		}

		event.target.value = '';
	};

	const handleSubmitUpdate = async (event) => {
		event.preventDefault();

		if (!selectedMember || !selectedMember._id) {
			setErrorMessage('Member details are not available');
			return;
		}

		setErrorMessage('');
		setNoticeMessage('');
		setIsSubmitting(true);

		try {
			const token = getToken();
			if (!token) {
				throw new Error('Please sign in again to continue');
			}

			const response = await fetch(`${API_BASE_URL}/api/members/${encodeURIComponent(selectedMember._id)}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					firstName: editFormData.firstName,
					lastName: editFormData.lastName,
					email: editFormData.email,
					gender: editFormData.gender,
					dob: editFormData.dob,
					profileImage: editFormData.profileImage,
				}),
			});

			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(data.message || 'Failed to update member');
			}

			const updatedMember = normalizeMember(data.item || {});
			setMembers((prev) => prev.map((item) => (item._id === updatedMember._id ? updatedMember : item)));
			setSelectedMember(updatedMember);
			setNoticeMessage(data.message || 'Member updated successfully');
			closeEditModal();
		} catch (error) {
			setErrorMessage(error.message || 'Failed to update member');
		} finally {
			setIsSubmitting(false);
		}
	};

	// Filter function for search
	const filterMembers = (members, searchQuery) => {
		if (!searchQuery.trim()) return members;
		
		const query = searchQuery.toLowerCase();
		return members.filter((member) =>
			member.id.toLowerCase().includes(query) ||
			member.firstName.toLowerCase().includes(query) ||
			member.lastName.toLowerCase().includes(query) ||
			member.email.toLowerCase().includes(query)
		);
	};

	const MembersTable = ({ title, data, searchQuery, setSearchQuery, hideSearch }) => {
		const filteredData = filterMembers(data, searchQuery);
		return (
			<div className="members-section">
				<h2 className="section-title">{title}</h2>
				{!hideSearch && (
					<div className="table-search-bar">
						<input
							type="text"
							placeholder="Search by Member ID, Name, or Email..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="search-input"
						/>
						<SearchIcon sx={{ fontSize: 18, color: '#999', marginLeft: '8px' }} />
					</div>
				)}
				<div className="table-wrapper">
					<table className="members-table">
						<thead>
							<tr>
								<th>Member Id</th>
								<th>First Name</th>
								<th>Last Name</th>
								<th>Email Address</th>
								<th>Gender</th>
								<th>Age</th>
								<th>Date of Birth</th>
								<th>Profile Image</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{filteredData.length === 0 ? (
								<tr>
									<td colSpan={9}>No members found</td>
								</tr>
							) : filteredData.map((member) => (
								<tr key={member._id || member.id || member.email}>
									<td>{member.id}</td>
									<td>{member.firstName}</td>
									<td>{member.lastName}</td>
									<td>{member.email}</td>
									<td>{member.gender}</td>
									<td>{member.age}</td>
									<td>{member.dob ? new Date(member.dob).toLocaleDateString() : '-'}</td>
									<td>
										<img src={member.profileImage} alt={member.firstName} className="profile-image" />
									</td>
									<td>
										<div className="action-buttons">
											<button
												className="btn btn-view"
												onClick={() => handleView(member._id)}
												title="View member details"
												aria-label="View member details"
											>
												<RemoveRedEyeIcon sx={{ fontSize: 18 }} />
											</button>
											<button
												className="btn btn-update"
												onClick={() => handleUpdate(member._id)}
												title="Update member information"
												aria-label="Update member information"
											>
												<EditIcon sx={{ fontSize: 18 }} />
											</button>
											<button
												className="btn btn-delete"
												onClick={() => handleDelete(member._id)}
												title="Delete member"
												aria-label="Delete member"
											>
												<DeleteIcon sx={{ fontSize: 18 }} />
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		);
	};

	return (
		<div className="members-container">
			<div className="members-header">
				<h1>Members Management</h1>
				<div className="header-right">
					<div className="header-search-bar">
						<input
							type="text"
							placeholder="Search by Member ID, Name, or Email..."
							value={isMaleOnly ? maleSearchQuery : isFemaleOnly ? femaleSearchQuery : maleSearchQuery}
							onChange={(e) => {
								if (isMaleOnly) {
									setMaleSearchQuery(e.target.value);
								} else if (isFemaleOnly) {
									setFemaleSearchQuery(e.target.value);
								} else {
									setMaleSearchQuery(e.target.value);
									setFemaleSearchQuery(e.target.value);
								}
							}}
							className="header-search-input"
						/>
						<SearchIcon sx={{ fontSize: 20, color: '#999', marginLeft: '8px' }} />
					</div>
					<button className="btn-add-member" onClick={handleAddMember} style={{ backgroundColor: accent }}>
						+ Add Member
					</button>
				</div>
			</div>

			{errorMessage ? (
				<div
					style={{
						marginBottom: 12,
						padding: '11px 12px',
						borderRadius: 10,
						background: '#fff1f2',
						border: '1px solid #fecdd3',
						color: '#b91c1c',
						fontSize: 13,
					}}
				>
					{errorMessage}
				</div>
			) : null}

			{noticeMessage ? (
				<div
					style={{
						marginBottom: 12,
						padding: '11px 12px',
						borderRadius: 10,
						background: '#ecfdf3',
						border: '1px solid #86efac',
						color: '#166534',
						fontSize: 13,
					}}
				>
					{noticeMessage}
				</div>
			) : null}

			{focusedMemberId && !focusedMember ? (
				<div
					style={{
						marginBottom: 12,
						padding: '11px 12px',
						borderRadius: 10,
						background: '#fff7ed',
						border: '1px solid #fdba74',
						color: '#9a3412',
						fontSize: 13,
					}}
				>
					Latest registered member is not available in the current list.
				</div>
			) : null}

			{isLoading && <p>Loading members...</p>}

			{!isLoading && (isMaleOnly || showBothTables) && <MembersTable title="Male Members" data={filteredMaleMembers} searchQuery={maleSearchQuery} setSearchQuery={setMaleSearchQuery} hideSearch={true} />}
			{!isLoading && (isFemaleOnly || showBothTables) && <MembersTable title="Female Members" data={filteredFemaleMembers} searchQuery={femaleSearchQuery} setSearchQuery={setFemaleSearchQuery} hideSearch={true} />}

			{isViewModalOpen && selectedMember ? (
				<div
					style={{
						position: 'fixed',
						inset: 0,
						background: 'rgba(15, 23, 42, 0.45)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 110,
						padding: 12,
					}}
					onClick={() => setIsViewModalOpen(false)}
				>
					<div
						style={{
							width: '100%',
							maxWidth: 520,
							background: '#fff',
							borderRadius: 14,
							padding: 18,
							boxShadow: '0 15px 35px rgba(2, 6, 23, 0.2)',
						}}
						onClick={(event) => event.stopPropagation()}
					>
						<h3 style={{ margin: '0 0 12px', color: '#111827', fontSize: 19 }}>Member Details</h3>
						<div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10, alignItems: 'center' }}>
							<img
								src={selectedMember.profileImage}
								alt={selectedMember.firstName}
								style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover' }}
							/>
							<div style={{ display: 'grid', gap: 4, fontSize: 13, color: '#374151' }}>
								<div><strong>Member ID:</strong> {selectedMember.id}</div>
								<div><strong>Name:</strong> {selectedMember.firstName} {selectedMember.lastName}</div>
								<div><strong>Email:</strong> {selectedMember.email}</div>
								<div><strong>Gender:</strong> {selectedMember.gender}</div>
								<div><strong>Age:</strong> {selectedMember.age}</div>
								<div><strong>DOB:</strong> {selectedMember.dob ? new Date(selectedMember.dob).toLocaleDateString() : '-'}</div>
								<div><strong>Status:</strong> {selectedMember.status}</div>
							</div>
						</div>
						<div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
							<button
								type="button"
								onClick={() => setIsViewModalOpen(false)}
								style={{
									padding: '10px 14px',
									borderRadius: 10,
									border: '1px solid #d1d5db',
									background: '#fff',
									cursor: 'pointer',
									fontWeight: 600,
								}}
							>
								Close
							</button>
						</div>
					</div>
				</div>
			) : null}

			{isAddModalOpen ? (
				<div
					style={{
						position: 'fixed',
						inset: 0,
						background: 'rgba(15, 23, 42, 0.45)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 110,
						padding: 12,
					}}
					onClick={closeAddModal}
				>
					<div
						style={{
							width: '100%',
							maxWidth: 560,
							background: '#fff',
							borderRadius: 14,
							padding: 18,
							boxShadow: '0 15px 35px rgba(2, 6, 23, 0.2)',
						}}
						onClick={(event) => event.stopPropagation()}
					>
						<h3 style={{ margin: '0 0 12px', color: '#111827', fontSize: 19 }}>Add Member</h3>
						<form onSubmit={handleSubmitAddMember} style={{ display: 'grid', gap: 10 }}>
							<input
								ref={addMemberImageInputRef}
								type="file"
								accept="image/*"
								onChange={handleAddProfileImageSelected}
								style={{ display: 'none' }}
							/>
							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
								<div style={{ display: 'grid', gap: 6 }}>
									<label style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>First Name</label>
									<input
										required
										value={addFormData.firstName}
										onChange={(event) => handleAddFieldChange('firstName', event.target.value)}
										style={{ padding: '10px 11px', borderRadius: 10, border: '1px solid #d1d5db' }}
									/>
								</div>

								<div style={{ display: 'grid', gap: 6 }}>
									<label style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>Last Name</label>
									<input
										required
										value={addFormData.lastName}
										onChange={(event) => handleAddFieldChange('lastName', event.target.value)}
										style={{ padding: '10px 11px', borderRadius: 10, border: '1px solid #d1d5db' }}
									/>
								</div>
							</div>

							<div style={{ display: 'grid', gap: 6 }}>
								<label style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>Email</label>
								<input
									required
									type="email"
									value={addFormData.email}
									onChange={(event) => handleAddFieldChange('email', event.target.value)}
									style={{ padding: '10px 11px', borderRadius: 10, border: '1px solid #d1d5db' }}
								/>
							</div>

							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
								<div style={{ display: 'grid', gap: 6 }}>
									<label style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>Gender</label>
									<select
										value={addFormData.gender}
										onChange={(event) => handleAddFieldChange('gender', event.target.value)}
										style={{ padding: '10px 11px', borderRadius: 10, border: '1px solid #d1d5db' }}
									>
										<option value="Male">Male</option>
										<option value="Female">Female</option>
									</select>
								</div>

								<div style={{ display: 'grid', gap: 6 }}>
									<label style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>Date of Birth</label>
									<input
										required
										type="date"
										value={addFormData.dob}
										onChange={(event) => handleAddFieldChange('dob', event.target.value)}
										style={{ padding: '10px 11px', borderRadius: 10, border: '1px solid #d1d5db' }}
									/>
								</div>
							</div>

							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
								<div style={{ display: 'grid', gap: 6 }}>
									<label style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>Password</label>
									<input
										required
										type="password"
										value={addFormData.password}
										onChange={(event) => handleAddFieldChange('password', event.target.value)}
										style={{ padding: '10px 11px', borderRadius: 10, border: '1px solid #d1d5db' }}
									/>
								</div>

								<div style={{ display: 'grid', gap: 6 }}>
									<label style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>Confirm Password</label>
									<input
										required
										type="password"
										value={addFormData.confirmPassword}
										onChange={(event) => handleAddFieldChange('confirmPassword', event.target.value)}
										style={{ padding: '10px 11px', borderRadius: 10, border: '1px solid #d1d5db' }}
									/>
								</div>
							</div>

							<div style={{ display: 'grid', gap: 8 }}>
								<label style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>Profile Image</label>
								<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
									<button
										type="button"
										onClick={handleSelectAddProfileImage}
										style={{
											padding: '8px 10px',
											borderRadius: 9,
											border: '1px solid #2563eb',
											background: '#eff6ff',
											cursor: 'pointer',
											fontSize: 12,
											fontWeight: 600,
										}}
									>
										Upload From Device
									</button>
									<button
										type="button"
										onClick={() => handleAddFieldChange('profileImage', '')}
										style={{
											padding: '8px 10px',
											borderRadius: 9,
											border: '1px solid #d1d5db',
											background: '#fff',
											cursor: 'pointer',
											fontSize: 12,
											fontWeight: 600,
										}}
									>
										Remove Image
									</button>
								</div>

								{addFormData.profileImage ? (
									<div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
										<img
											src={addFormData.profileImage}
											alt="Member profile preview"
											style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }}
										/>
										<span style={{ fontSize: 12, color: '#4b5563' }}>Image ready</span>
									</div>
								) : (
									<span style={{ fontSize: 12, color: '#6b7280' }}>No image selected</span>
								)}
							</div>

							<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
								<button
									type="button"
									onClick={closeAddModal}
									style={{
										padding: '10px 14px',
										borderRadius: 10,
										border: '1px solid #d1d5db',
										background: '#fff',
										cursor: 'pointer',
										fontWeight: 600,
									}}
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={isSubmitting}
									style={{
										padding: '10px 14px',
										borderRadius: 10,
										border: 'none',
										background: accent,
										color: '#2d3a00',
										cursor: isSubmitting ? 'not-allowed' : 'pointer',
										fontWeight: 700,
										opacity: isSubmitting ? 0.7 : 1,
									}}
								>
									{isSubmitting ? 'Saving...' : 'Add Member'}
								</button>
							</div>
						</form>
					</div>
				</div>
			) : null}

			{isEditModalOpen && selectedMember ? (
				<div
					style={{
						position: 'fixed',
						inset: 0,
						background: 'rgba(15, 23, 42, 0.45)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 110,
						padding: 12,
					}}
					onClick={closeEditModal}
				>
					<div
						style={{
							width: '100%',
							maxWidth: 560,
							background: '#fff',
							borderRadius: 14,
							padding: 18,
							boxShadow: '0 15px 35px rgba(2, 6, 23, 0.2)',
						}}
						onClick={(event) => event.stopPropagation()}
					>
						<h3 style={{ margin: '0 0 12px', color: '#111827', fontSize: 19 }}>Update Member</h3>
						<form onSubmit={handleSubmitUpdate} style={{ display: 'grid', gap: 10 }}>
							<input
								ref={memberImageInputRef}
								type="file"
								accept="image/*"
								onChange={handleProfileImageSelected}
								style={{ display: 'none' }}
							/>
							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
								<div style={{ display: 'grid', gap: 6 }}>
									<label style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>First Name</label>
									<input
										required
										value={editFormData.firstName}
										onChange={(event) => handleEditFieldChange('firstName', event.target.value)}
										style={{ padding: '10px 11px', borderRadius: 10, border: '1px solid #d1d5db' }}
									/>
								</div>

								<div style={{ display: 'grid', gap: 6 }}>
									<label style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>Last Name</label>
									<input
										required
										value={editFormData.lastName}
										onChange={(event) => handleEditFieldChange('lastName', event.target.value)}
										style={{ padding: '10px 11px', borderRadius: 10, border: '1px solid #d1d5db' }}
									/>
								</div>
							</div>

							<div style={{ display: 'grid', gap: 6 }}>
								<label style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>Email</label>
								<input
									required
									type="email"
									value={editFormData.email}
									onChange={(event) => handleEditFieldChange('email', event.target.value)}
									style={{ padding: '10px 11px', borderRadius: 10, border: '1px solid #d1d5db' }}
								/>
							</div>

							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
								<div style={{ display: 'grid', gap: 6 }}>
									<label style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>Gender</label>
									<select
										value={editFormData.gender}
										onChange={(event) => handleEditFieldChange('gender', event.target.value)}
										style={{ padding: '10px 11px', borderRadius: 10, border: '1px solid #d1d5db' }}
									>
										<option value="Male">Male</option>
										<option value="Female">Female</option>
									</select>
								</div>

								<div style={{ display: 'grid', gap: 6 }}>
									<label style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>Date of Birth</label>
									<input
										required
										type="date"
										value={editFormData.dob}
										onChange={(event) => handleEditFieldChange('dob', event.target.value)}
										style={{ padding: '10px 11px', borderRadius: 10, border: '1px solid #d1d5db' }}
									/>
								</div>
							</div>

							<div style={{ display: 'grid', gap: 8 }}>
								<label style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>Profile Image</label>
								<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
									<button
										type="button"
										onClick={handleSelectProfileImage}
										style={{
											padding: '8px 10px',
											borderRadius: 9,
											border: '1px solid #2563eb',
											background: '#eff6ff',
											cursor: 'pointer',
											fontSize: 12,
											fontWeight: 600,
										}}
									>
										Upload From Device
									</button>
									<button
										type="button"
										onClick={() => handleEditFieldChange('profileImage', '')}
										style={{
											padding: '8px 10px',
											borderRadius: 9,
											border: '1px solid #d1d5db',
											background: '#fff',
											cursor: 'pointer',
											fontSize: 12,
											fontWeight: 600,
										}}
									>
										Remove Image
									</button>
								</div>

								{editFormData.profileImage ? (
									<div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
										<img
											src={editFormData.profileImage}
											alt="Member profile preview"
											style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }}
										/>
										<span style={{ fontSize: 12, color: '#4b5563' }}>Image ready</span>
									</div>
								) : (
									<span style={{ fontSize: 12, color: '#6b7280' }}>No image selected</span>
								)}
							</div>

							<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
								<button
									type="button"
									onClick={closeEditModal}
									style={{
										padding: '10px 14px',
										borderRadius: 10,
										border: '1px solid #d1d5db',
										background: '#fff',
										cursor: 'pointer',
										fontWeight: 600,
									}}
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={isSubmitting}
									style={{
										padding: '10px 14px',
										borderRadius: 10,
										border: 'none',
										background: accent,
										color: '#2d3a00',
										cursor: isSubmitting ? 'not-allowed' : 'pointer',
										fontWeight: 700,
										opacity: isSubmitting ? 0.7 : 1,
									}}
								>
									{isSubmitting ? 'Saving...' : 'Update Member'}
								</button>
							</div>
						</form>
					</div>
				</div>
			) : null}
		</div>
	);
}
