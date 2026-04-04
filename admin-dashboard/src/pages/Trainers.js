import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SearchIcon from '@mui/icons-material/Search';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import maleProfileImage from '../assets/images/Male-Profile.png';
import femaleProfileImage from '../assets/images/female-Profile.png';
import "../styles/Members.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const AUTH_TOKEN_KEY = 'ff_admin_token';
const TRAINER_ROLE_OPTIONS = ['Strength Coach', 'Yoga Instructor', 'Cardio Trainer'];

function normalizeTrainerIdInput(value) {
	const raw = String(value || '').toUpperCase();
	const collapsed = raw.replace(/\s+/g, '');
	const modernMatch = collapsed.match(/^([MF])T-?([0-9O]*)$/);
	if (modernMatch) {
		const prefix = modernMatch[1] === 'F' ? 'FT' : 'MT';
		const digits = String(modernMatch[2] || '').replace(/O/g, '0');
		if (!digits) {
			return `${prefix}-`;
		}
		return `${prefix}-${digits}`;
	}

	const legacyMatch = collapsed.match(/^T-([MF])([0-9O]*)$/);
	if (legacyMatch) {
		const prefix = legacyMatch[1] === 'F' ? 'FT' : 'MT';
		const digits = String(legacyMatch[2] || '').replace(/O/g, '0');
		if (!digits) {
			return `${prefix}-`;
		}
		return `${prefix}-${digits}`;
	}

	return collapsed;
}

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

function readFileAsDataUrl(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result || ''));
		reader.onerror = () => reject(new Error('Failed to read image file'));
		reader.readAsDataURL(file);
	});
}

function compressImageDataUrl(dataUrl, maxSize = 960, quality = 0.75) {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.onload = () => {
			let { width, height } = image;
			const largerSide = Math.max(width, height);

			if (largerSide > maxSize) {
				const ratio = maxSize / largerSide;
				width = Math.round(width * ratio);
				height = Math.round(height * ratio);
			}

			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext('2d');

			if (!ctx) {
				reject(new Error('Image compression is not supported on this browser'));
				return;
			}

			ctx.drawImage(image, 0, 0, width, height);
			resolve(canvas.toDataURL('image/jpeg', quality));
		};

		image.onerror = () => reject(new Error('Failed to process image'));
		image.src = dataUrl;
	});
}

const initialFormState = {
	trainerId: '',
	firstName: '',
	lastName: '',
	email: '',
	role: 'Strength Coach',
	gender: 'Male',
	dob: '',
	status: 'Active',
	profileImage: '',
};

function getAutoGenderByNav(navKey) {
	if (navKey === 'trainers-female') {
		return 'Female';
	}

	return 'Male';
}

export default function Trainers({ accent, activeNav }) {
	const [maleSearchQuery, setMaleSearchQuery] = useState("");
	const [femaleSearchQuery, setFemaleSearchQuery] = useState("");
	const [trainers, setTrainers] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState('');
	const [noticeMessage, setNoticeMessage] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [isEditMode, setIsEditMode] = useState(false);
	const [editingTrainerId, setEditingTrainerId] = useState('');
	const [formData, setFormData] = useState(initialFormState);
	const [selectedTrainer, setSelectedTrainer] = useState(null);
	const [isViewModalOpen, setIsViewModalOpen] = useState(false);
	const [profileImageMode, setProfileImageMode] = useState('skip');
	const [profilePreview, setProfilePreview] = useState('');
	const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
	const [cameraError, setCameraError] = useState('');
	const cameraInputRef = useRef(null);
	const fileInputRef = useRef(null);
	const cameraVideoRef = useRef(null);
	const cameraStreamRef = useRef(null);
	const calculatedAge = useMemo(() => calculateAgeFromDob(formData.dob), [formData.dob]);

	const stopCameraStream = useCallback(() => {
		if (cameraStreamRef.current) {
			cameraStreamRef.current.getTracks().forEach((track) => track.stop());
			cameraStreamRef.current = null;
		}

		if (cameraVideoRef.current) {
			cameraVideoRef.current.srcObject = null;
		}
	}, []);

	useEffect(() => {
		return () => {
			stopCameraStream();
		};
	}, [stopCameraStream]);

	const loadTrainers = useCallback(async () => {
		setIsLoading(true);
		setErrorMessage('');

		try {
			const token = getToken();
			const response = await fetch(`${API_BASE_URL}/api/trainers`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(data.message || 'Failed to load trainers');
			}

			setTrainers(Array.isArray(data.items) ? data.items : []);
		} catch (error) {
			setErrorMessage(error.message || 'Failed to load trainers');
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadTrainers();
	}, [loadTrainers]);

	const maleTrainers = useMemo(
		() => trainers.filter((trainer) => String(trainer.gender).toLowerCase() === 'male'),
		[trainers]
	);

	const femaleTrainers = useMemo(
		() => trainers.filter((trainer) => String(trainer.gender).toLowerCase() === 'female'),
		[trainers]
	);

	const isMaleOnly = activeNav === "trainers-male";
	const isFemaleOnly = activeNav === "trainers-female";
	const showBothTables = activeNav === "trainers" || !activeNav;

	const closeTrainerFormModal = () => {
		setIsAddModalOpen(false);
		setIsEditMode(false);
		setEditingTrainerId('');
		handleCloseCameraModal();
	};

	const handleView = (trainer) => {
		setSelectedTrainer(trainer);
		setIsViewModalOpen(true);
	};

	const handleUpdate = (trainer) => {
		setNoticeMessage('');
		setErrorMessage('');
		setIsEditMode(true);
		setEditingTrainerId(String(trainer.trainerId || ''));
		setFormData({
			trainerId: String(trainer.trainerId || ''),
			firstName: String(trainer.firstName || ''),
			lastName: String(trainer.lastName || ''),
			email: String(trainer.email || ''),
			role: TRAINER_ROLE_OPTIONS.includes(String(trainer.role || ''))
				? String(trainer.role)
				: 'Strength Coach',
			gender: String(trainer.gender || 'Male'),
			dob: trainer.dob ? String(trainer.dob).slice(0, 10) : '',
			status: String(trainer.status || 'Active'),
			profileImage: String(trainer.profileImage || ''),
		});
		setProfilePreview(String(trainer.profileImage || ''));
		setProfileImageMode(trainer.profileImage ? 'file' : 'skip');
		setCameraError('');
		setIsCameraModalOpen(false);
		stopCameraStream();
		setIsAddModalOpen(true);
	};

	const handleDelete = async (trainer) => {
		const trainerLabel = `${trainer.firstName || ''} ${trainer.lastName || ''}`.trim() || trainer.trainerId;
		const isConfirmed = window.confirm(`Delete trainer ${trainerLabel}? This action cannot be undone.`);
		if (!isConfirmed) {
			return;
		}

		setErrorMessage('');
		setNoticeMessage('');

		try {
			const token = getToken();
			const response = await fetch(`${API_BASE_URL}/api/trainers/${encodeURIComponent(String(trainer.trainerId || ''))}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(data.message || 'Failed to delete trainer');
			}

			setTrainers((prev) => prev.filter((item) => item.trainerId !== trainer.trainerId));
			setNoticeMessage(data.message || 'Trainer deleted successfully');
		} catch (error) {
			setErrorMessage(error.message || 'Failed to delete trainer');
		}
	};

	const handleAddTrainer = () => {
		setNoticeMessage('');
		setErrorMessage('');
		setIsEditMode(false);
		setEditingTrainerId('');
		setFormData({
			...initialFormState,
			gender: getAutoGenderByNav(activeNav),
		});
		setProfileImageMode('skip');
		setProfilePreview('');
		setCameraError('');
		setIsCameraModalOpen(false);
		stopCameraStream();
		setIsAddModalOpen(true);
	};

	useEffect(() => {
		if (!isAddModalOpen) {
			return;
		}

		if (activeNav === 'trainers-male' || activeNav === 'trainers-female') {
			setFormData((prev) => ({
				...prev,
				gender: getAutoGenderByNav(activeNav),
			}));
		}
	}, [activeNav, isAddModalOpen]);

	const handleFormChange = (field, value) => {
		const resolvedValue = field === 'trainerId' ? normalizeTrainerIdInput(value) : value;
		setFormData((prev) => ({
			...prev,
			[field]: resolvedValue,
		}));
	};

	const handleCreateTrainer = async (event) => {
		event.preventDefault();
		setErrorMessage('');
		setNoticeMessage('');
		setIsSubmitting(true);

		if (!calculatedAge || calculatedAge < 16 || calculatedAge > 100) {
			setErrorMessage('Age is automatically calculated from birthday and must be between 16 and 100');
			setIsSubmitting(false);
			return;
		}

		try {
			const token = getToken();
			const resolvedProfileImage =
				String(formData.profileImage || '').trim() ||
				(formData.gender === 'Female' ? femaleProfileImage : maleProfileImage);
			const targetTrainerId = isEditMode ? editingTrainerId : formData.trainerId;
			const endpoint = isEditMode
				? `${API_BASE_URL}/api/trainers/${encodeURIComponent(String(targetTrainerId || ''))}`
				: `${API_BASE_URL}/api/trainers`;
			const method = isEditMode ? 'PUT' : 'POST';

			const response = await fetch(endpoint, {
				method,
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					trainerId: targetTrainerId,
					firstName: formData.firstName,
					lastName: formData.lastName,
					email: formData.email,
					role: formData.role,
					gender: formData.gender,
					dob: formData.dob,
					status: formData.status,
					profileImage: resolvedProfileImage,
				}),
			});

			const data = await response.json().catch(() => ({}));
			if (!response.ok) {
				if (response.status === 413) {
					throw new Error('Selected image is too large. Please try a smaller image.');
				}
				throw new Error(data.message || (isEditMode ? 'Failed to update trainer' : 'Failed to create trainer'));
			}

			if (isEditMode) {
				setTrainers((prev) =>
					prev.map((item) => (item.trainerId === editingTrainerId ? data.item : item))
				);
			} else {
				setTrainers((prev) => [data.item, ...prev]);
			}

			closeTrainerFormModal();
			setFormData(initialFormState);
			setProfileImageMode('skip');
			setProfilePreview('');
			setCameraError('');
			setIsCameraModalOpen(false);
			stopCameraStream();
			setNoticeMessage(data.message || (isEditMode ? 'Trainer updated successfully' : 'Trainer added successfully'));
		} catch (error) {
			setErrorMessage(error.message || (isEditMode ? 'Failed to update trainer' : 'Failed to create trainer'));
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleImageSelected = async (event) => {
		const file = event.target.files && event.target.files[0];
		if (!file) {
			return;
		}

		try {
			const dataUrl = await readFileAsDataUrl(file);
			const compressedDataUrl = await compressImageDataUrl(dataUrl);
			setFormData((prev) => ({ ...prev, profileImage: compressedDataUrl }));
			setProfilePreview(compressedDataUrl);
		} catch (error) {
			setErrorMessage(error.message || 'Failed to read selected image');
		}

		event.target.value = '';
	};

	const handleCaptureImage = () => {
		setProfileImageMode('camera');
		setCameraError('');

		if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
			setCameraError('Camera access is not supported by this browser. Please select an image from device.');
			if (cameraInputRef.current) {
				cameraInputRef.current.click();
			}
			return;
		}

		navigator.mediaDevices
			.getUserMedia({ video: { facingMode: 'user' } })
			.then((stream) => {
				cameraStreamRef.current = stream;
				setIsCameraModalOpen(true);

				setTimeout(() => {
					if (cameraVideoRef.current) {
						cameraVideoRef.current.srcObject = stream;
						cameraVideoRef.current.play().catch(() => {});
					}
				}, 0);
			})
			.catch((error) => {
				setCameraError(error.message || 'Unable to access camera.');
				if (cameraInputRef.current) {
					cameraInputRef.current.click();
				}
			});
	};

	const handleChooseFile = () => {
		setProfileImageMode('file');
		if (fileInputRef.current) {
			fileInputRef.current.click();
		}
	};

	const handleSkipImage = () => {
		setProfileImageMode('skip');
		setProfilePreview('');
		setFormData((prev) => ({ ...prev, profileImage: '' }));
		setCameraError('');
		setIsCameraModalOpen(false);
		stopCameraStream();
	};

	const handleCaptureFromCameraModal = () => {
		if (!cameraVideoRef.current) {
			setCameraError('Camera stream is not ready yet. Please try again.');
			return;
		}

		const video = cameraVideoRef.current;
		const width = video.videoWidth || 640;
		const height = video.videoHeight || 480;
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext('2d');

		if (!ctx) {
			setCameraError('Unable to capture image from camera.');
			return;
		}

		ctx.drawImage(video, 0, 0, width, height);
		const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
		setFormData((prev) => ({ ...prev, profileImage: dataUrl }));
		setProfilePreview(dataUrl);
		setIsCameraModalOpen(false);
		stopCameraStream();
	};

	const handleCloseCameraModal = () => {
		setIsCameraModalOpen(false);
		stopCameraStream();
	};

	const filterTrainers = (trainers, searchQuery) => {
		if (!searchQuery.trim()) return trainers;

		const query = searchQuery.toLowerCase();
		return trainers.filter((trainer) =>
			String(trainer.trainerId || '').toLowerCase().includes(query) ||
			String(trainer.firstName || '').toLowerCase().includes(query) ||
			String(trainer.lastName || '').toLowerCase().includes(query) ||
			String(trainer.email || '').toLowerCase().includes(query) ||
			String(trainer.role || '').toLowerCase().includes(query)
		);
	};

	const TrainersTable = ({ title, data, searchQuery, setSearchQuery, hideSearch }) => {
		const filteredData = filterTrainers(data, searchQuery);
		return (
			<div className="members-section">
				<h2 className="section-title">{title}</h2>
				{!hideSearch && (
					<div className="table-search-bar">
						<input
							type="text"
							placeholder="Search by Trainer ID, Name, or Email..."
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
								<th>Trainer Id</th>
								<th>First Name</th>
								<th>Last Name</th>
								<th>Email Address</th>
								<th>Role</th>
								<th>Gender</th>
								<th>Age</th>
								<th>Date of Birth</th>
								<th>Profile Image</th>
								<th>Status</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{filteredData.map((trainer) => (
								<tr key={trainer._id || trainer.trainerId}>
									<td>{trainer.trainerId}</td>
									<td>{trainer.firstName}</td>
									<td>{trainer.lastName}</td>
									<td>{trainer.email}</td>
									<td>{trainer.role || 'Strength Coach'}</td>
									<td>{trainer.gender}</td>
									<td>{trainer.age}</td>
									<td>{new Date(trainer.dob).toLocaleDateString()}</td>
									<td>
										<img src={trainer.profileImage} alt={trainer.firstName} className="profile-image" />
									</td>
									<td>
										<span
											style={{
												padding: '4px 8px',
												borderRadius: 6,
												fontSize: 12,
												fontWeight: 600,
												background: trainer.status === 'Active' ? '#ecfdf3' : '#fef2f2',
												color: trainer.status === 'Active' ? '#166534' : '#991b1b',
											}}
										>
											{trainer.status}
										</span>
									</td>
									<td>
										<div className="action-buttons">
											<button
												className="btn btn-view"
												onClick={() => handleView(trainer)}
												title="View trainer details"
												aria-label="View trainer details"
											>
												<RemoveRedEyeIcon sx={{ fontSize: 18 }} />
											</button>
											<button
												className="btn btn-update"
												onClick={() => handleUpdate(trainer)}
												title="Update trainer information"
												aria-label="Update trainer information"
											>
												<EditIcon sx={{ fontSize: 18 }} />
											</button>
											<button
												className="btn btn-delete"
												onClick={() => handleDelete(trainer)}
												title="Delete trainer"
												aria-label="Delete trainer"
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
			{errorMessage ? (
				<div
					style={{
						background: '#fef2f2',
						color: '#991b1b',
						border: '1px solid #fecaca',
						padding: '10px 12px',
						borderRadius: 10,
						marginBottom: 12,
						fontSize: 13,
					}}
				>
					{errorMessage}
				</div>
			) : null}

			{noticeMessage ? (
				<div
					style={{
						background: '#ecfdf3',
						color: '#166534',
						border: '1px solid #bbf7d0',
						padding: '10px 12px',
						borderRadius: 10,
						marginBottom: 12,
						fontSize: 13,
					}}
				>
					{noticeMessage}
				</div>
			) : null}

			<div className="members-header">
				<h1>Trainers Management</h1>
				<div className="header-right">
					<div className="header-search-bar">
						<input
							type="text"
							placeholder="Search by Trainer ID, Name, or Email..."
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
					<button className="btn-add-member" onClick={handleAddTrainer} style={{ backgroundColor: accent }}>
						+ Add Trainer
					</button>
				</div>
			</div>

			{isLoading ? (
				<div style={{ padding: '12px 4px', color: '#6b7280', fontSize: 13 }}>Loading trainers...</div>
			) : null}

			{!isLoading && (isMaleOnly || showBothTables) && (
				<TrainersTable
					title="Male Trainers"
					data={maleTrainers}
					searchQuery={maleSearchQuery}
					setSearchQuery={setMaleSearchQuery}
					hideSearch={true}
				/>
			)}
			{!isLoading && (isFemaleOnly || showBothTables) && (
				<TrainersTable
					title="Female Trainers"
					data={femaleTrainers}
					searchQuery={femaleSearchQuery}
					setSearchQuery={setFemaleSearchQuery}
					hideSearch={true}
				/>
			)}

			{isAddModalOpen ? (
				<div
					style={{
						position: 'fixed',
						inset: 0,
						background: 'rgba(15, 23, 42, 0.45)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 100,
						padding: 12,
					}}
						onClick={closeTrainerFormModal}
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
						<h3 style={{ margin: '0 0 12px', color: '#111827', fontSize: 19 }}>
							{isEditMode ? 'Update Trainer' : 'Add New Trainer'}
						</h3>

						<form onSubmit={handleCreateTrainer} style={{ display: 'grid', gap: 10 }}>
							<input
								ref={cameraInputRef}
								type="file"
								accept="image/*"
								capture="environment"
								onChange={handleImageSelected}
								style={{ display: 'none' }}
							/>
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								onChange={handleImageSelected}
								style={{ display: 'none' }}
							/>

							<div style={{ display: 'grid', gap: 6 }}>
								<label style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>Trainer ID</label>
								<input
									required
									value={formData.trainerId}
									disabled={isEditMode}
									onChange={(event) => handleFormChange('trainerId', event.target.value)}
									placeholder="T-M004"
									placeholder="FT-005"
									style={{
										padding: '10px 11px',
										borderRadius: 10,
										border: '1px solid #d1d5db',
										background: isEditMode ? '#f8fafc' : '#fff',
									}}
								/>
							</div>

							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
								<div style={{ display: 'grid', gap: 6 }}>
									<label style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>First Name</label>
									<input
										required
										value={formData.firstName}
										onChange={(event) => handleFormChange('firstName', event.target.value)}
										style={{ padding: '10px 11px', borderRadius: 10, border: '1px solid #d1d5db' }}
									/>
								</div>

								<div style={{ display: 'grid', gap: 6 }}>
									<label style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>Last Name</label>
									<input
										required
										value={formData.lastName}
										onChange={(event) => handleFormChange('lastName', event.target.value)}
										style={{ padding: '10px 11px', borderRadius: 10, border: '1px solid #d1d5db' }}
									/>
								</div>
							</div>

							<div style={{ display: 'grid', gap: 6 }}>
								<label style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>Email</label>
								<input
									required
									type="email"
									value={formData.email}
									onChange={(event) => handleFormChange('email', event.target.value)}
									style={{ padding: '10px 11px', borderRadius: 10, border: '1px solid #d1d5db' }}
								/>
							</div>

							<div style={{ display: 'grid', gap: 6 }}>
								<label style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>Role</label>
								<select
									value={formData.role}
									onChange={(event) => handleFormChange('role', event.target.value)}
									style={{ padding: '10px 11px', borderRadius: 10, border: '1px solid #d1d5db' }}
								>
									{TRAINER_ROLE_OPTIONS.map((roleOption) => (
										<option key={roleOption} value={roleOption}>
											{roleOption}
										</option>
									))}
								</select>
							</div>

							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
								<div style={{ display: 'grid', gap: 6 }}>
									<label style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>Gender</label>
									<select
										value={formData.gender}
										onChange={(event) => handleFormChange('gender', event.target.value)}
										style={{ padding: '10px 11px', borderRadius: 10, border: '1px solid #d1d5db' }}
									>
										<option value="Male">Male</option>
										<option value="Female">Female</option>
									</select>
								</div>

								<div style={{ display: 'grid', gap: 6 }}>
									<label style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>Age (Auto)</label>
									<input
										readOnly
										value={calculatedAge}
										placeholder="Select birthday"
										style={{
											padding: '10px 11px',
											borderRadius: 10,
											border: '1px solid #d1d5db',
											background: '#f8fafc',
										}}
									/>
								</div>

								<div style={{ display: 'grid', gap: 6 }}>
									<label style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>Status</label>
									<select
										value={formData.status}
										onChange={(event) => handleFormChange('status', event.target.value)}
										style={{ padding: '10px 11px', borderRadius: 10, border: '1px solid #d1d5db' }}
									>
										<option value="Active">Active</option>
										<option value="Inactive">Inactive</option>
									</select>
								</div>
							</div>

							<div style={{ display: 'grid', gap: 6 }}>
								<label style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>Date of Birth</label>
								<input
									required
									type="date"
									value={formData.dob}
									onChange={(event) => handleFormChange('dob', event.target.value)}
									style={{ padding: '10px 11px', borderRadius: 10, border: '1px solid #d1d5db' }}
								/>
							</div>

							<div style={{ display: 'grid', gap: 8 }}>
								<label style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>Profile Picture</label>
								<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
									<button
										type="button"
										onClick={handleCaptureImage}
										style={{
											padding: '8px 10px',
											borderRadius: 9,
											border: profileImageMode === 'camera' ? '1px solid #16a34a' : '1px solid #d1d5db',
											background: profileImageMode === 'camera' ? '#ecfdf3' : '#fff',
											cursor: 'pointer',
											fontSize: 12,
											fontWeight: 600,
										}}
									>
										1. Capture From Camera
									</button>
									<button
										type="button"
										onClick={handleChooseFile}
										style={{
											padding: '8px 10px',
											borderRadius: 9,
											border: profileImageMode === 'file' ? '1px solid #2563eb' : '1px solid #d1d5db',
											background: profileImageMode === 'file' ? '#eff6ff' : '#fff',
											cursor: 'pointer',
											fontSize: 12,
											fontWeight: 600,
										}}
									>
										2. Select From Device
									</button>
									<button
										type="button"
										onClick={handleSkipImage}
										style={{
											padding: '8px 10px',
											borderRadius: 9,
											border: profileImageMode === 'skip' ? '1px solid #6b7280' : '1px solid #d1d5db',
											background: profileImageMode === 'skip' ? '#f3f4f6' : '#fff',
											cursor: 'pointer',
											fontSize: 12,
											fontWeight: 600,
										}}
									>
										3. Skip For Now
									</button>
								</div>

								{profilePreview ? (
									<div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
										<img
											src={profilePreview}
											alt="Trainer profile preview"
											style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }}
										/>
										<span style={{ fontSize: 12, color: '#4b5563' }}>Image ready to upload</span>
									</div>
								) : (
									<span style={{ fontSize: 12, color: '#6b7280' }}>
										No image selected. Default profile image will be used.
									</span>
								)}
							</div>

							<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
								<button
									type="button"
									onClick={closeTrainerFormModal}
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
										{isSubmitting ? 'Saving...' : isEditMode ? 'Update Trainer' : 'Save Trainer'}
								</button>
							</div>
						</form>
					</div>
				</div>
			) : null}

			{isViewModalOpen && selectedTrainer ? (
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
						<h3 style={{ margin: '0 0 12px', color: '#111827', fontSize: 19 }}>Trainer Details</h3>
						<div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10, alignItems: 'center' }}>
							<img
								src={selectedTrainer.profileImage}
								alt={selectedTrainer.firstName}
								style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover' }}
							/>
							<div style={{ display: 'grid', gap: 4, fontSize: 13, color: '#374151' }}>
								<div><strong>ID:</strong> {selectedTrainer.trainerId}</div>
								<div><strong>Name:</strong> {selectedTrainer.firstName} {selectedTrainer.lastName}</div>
								<div><strong>Email:</strong> {selectedTrainer.email}</div>
								<div><strong>Role:</strong> {selectedTrainer.role || 'Strength Coach'}</div>
								<div><strong>Gender:</strong> {selectedTrainer.gender}</div>
								<div><strong>Age:</strong> {selectedTrainer.age}</div>
								<div><strong>DOB:</strong> {new Date(selectedTrainer.dob).toLocaleDateString()}</div>
								<div><strong>Status:</strong> {selectedTrainer.status}</div>
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

			{isCameraModalOpen ? (
				<div
					style={{
						position: 'fixed',
						inset: 0,
						background: 'rgba(2, 6, 23, 0.75)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 120,
						padding: 12,
					}}
					onClick={handleCloseCameraModal}
				>
					<div
						style={{
							width: '100%',
							maxWidth: 640,
							background: '#0f172a',
							borderRadius: 14,
							padding: 12,
							boxShadow: '0 20px 40px rgba(2, 6, 23, 0.45)',
						}}
						onClick={(event) => event.stopPropagation()}
					>
						<div style={{ color: '#fff', fontWeight: 700, marginBottom: 10, fontSize: 14 }}>
							Camera Capture
						</div>
						<video
							ref={cameraVideoRef}
							autoPlay
							playsInline
							muted
							style={{ width: '100%', borderRadius: 10, background: '#111827' }}
						/>
						<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
							<button
								type="button"
								onClick={handleCloseCameraModal}
								style={{
									padding: '9px 12px',
									borderRadius: 9,
									border: '1px solid #334155',
									background: '#1e293b',
									color: '#e2e8f0',
									cursor: 'pointer',
									fontWeight: 600,
								}}
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleCaptureFromCameraModal}
								style={{
									padding: '9px 12px',
									borderRadius: 9,
									border: 'none',
									background: '#22c55e',
									color: '#052e16',
									cursor: 'pointer',
									fontWeight: 700,
								}}
							>
								Capture
							</button>
						</div>
					</div>
				</div>
			) : null}

			{cameraError ? (
				<div
					style={{
						position: 'fixed',
						bottom: 14,
						right: 14,
						background: '#fef2f2',
						color: '#991b1b',
						border: '1px solid #fecaca',
						padding: '8px 10px',
						borderRadius: 10,
						fontSize: 12,
						zIndex: 130,
					}}
				>
					{cameraError}
				</div>
			) : null}
		</div>
	);
}
