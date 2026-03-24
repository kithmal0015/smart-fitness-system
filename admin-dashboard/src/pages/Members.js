import React, { useCallback, useEffect, useMemo, useState } from "react";
import SearchIcon from '@mui/icons-material/Search';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import "../styles/Members.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const AUTH_TOKEN_KEY = 'ff_admin_token';

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
		status: String((item && item.status) || 'Active'),
		profileImage: String((item && item.profileImage) || 'https://via.placeholder.com/40'),
	};
}

export default function Members({ accent, activeNav }) {
	const [maleSearchQuery, setMaleSearchQuery] = useState("");
	const [femaleSearchQuery, setFemaleSearchQuery] = useState("");
	const [members, setMembers] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState('');

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
		const maleRows = members.filter(
			(member) => String(member.gender || '').toLowerCase() === 'male'
		);

		return maleRows.map((member, index) => ({
			...member,
			id: member.id || `M${String(index + 1).padStart(3, '0')}`,
		}));
	}, [members]);

	const femaleMembers = useMemo(() => {
		const femaleRows = members.filter(
			(member) => String(member.gender || '').toLowerCase() === 'female'
		);

		return femaleRows.map((member, index) => ({
			...member,
			id: member.id || `F${String(index + 1).padStart(3, '0')}`,
		}));
	}, [members]);

	// Determine which table to show based on activeNav
	const isMaleOnly = activeNav === "male";
	const isFemaleOnly = activeNav === "female";
	const showBothTables = activeNav === "members" || !activeNav;

	const handleView = (memberId) => {
		alert(`View member: ${memberId}`);
	};

	const handleUpdate = (memberId) => {
		alert(`Update member: ${memberId}`);
	};

	const handleDelete = (memberId) => {
		alert(`Delete member: ${memberId}`);
	};

	const handleAddMember = () => {
		alert("Members are created from the mobile app after successful payment");
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

	const MembersTable = ({ title, data, accentColor, searchQuery, setSearchQuery, hideSearch }) => {
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
									<td>{new Date(member.dob).toLocaleDateString()}</td>
									<td>
										<img src={member.profileImage} alt={member.firstName} className="profile-image" />
									</td>
									<td>
										<div className="action-buttons">
											<button
												className="btn btn-view"
												onClick={() => handleView(member.id)}
												title="View member details"
												aria-label="View member details"
											>
												<RemoveRedEyeIcon sx={{ fontSize: 18 }} />
											</button>
											<button
												className="btn btn-update"
												onClick={() => handleUpdate(member.id)}
												title="Update member information"
												aria-label="Update member information"
											>
												<EditIcon sx={{ fontSize: 18 }} />
											</button>
											<button
												className="btn btn-delete"
												onClick={() => handleDelete(member.id)}
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

			{isLoading && <p>Loading members...</p>}
			{!isLoading && errorMessage && <p>{errorMessage}</p>}

			{!isLoading && !errorMessage && (isMaleOnly || showBothTables) && <MembersTable title="Male Members" data={maleMembers} accentColor={accent} searchQuery={maleSearchQuery} setSearchQuery={setMaleSearchQuery} hideSearch={true} />}
			{!isLoading && !errorMessage && (isFemaleOnly || showBothTables) && <MembersTable title="Female Members" data={femaleMembers} accentColor={accent} searchQuery={femaleSearchQuery} setSearchQuery={setFemaleSearchQuery} hideSearch={true} />}
		</div>
	);
}
