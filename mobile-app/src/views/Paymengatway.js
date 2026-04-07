import React, { useMemo, useState } from 'react';
import {
	Alert,
	SafeAreaView,
	ScrollView,
	StatusBar,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { API_BASE_URL } from '../config/api';

const ADMISSION_FEE = 1000;
const MONTH_FEE = 2000;

export default function Paymengatway({ navigation, route }) {
	const registerData = route && route.params ? route.params.registerData : null;
	const [paymentMethod, setPaymentMethod] = useState('card');
	const [includeMonthFee, setIncludeMonthFee] = useState(false);
	const [cardNumber, setCardNumber] = useState('');
	const [expiryDate, setExpiryDate] = useState('');
	const [cvv, setCvv] = useState('');
	const [saveCardDetails, setSaveCardDetails] = useState(false);
	const [agreeTerms, setAgreeTerms] = useState(false);
	const [isPaying, setIsPaying] = useState(false);

	const totalAmount = useMemo(() => {
		return includeMonthFee ? ADMISSION_FEE + MONTH_FEE : ADMISSION_FEE;
	}, [includeMonthFee]);

	const formatCardNumber = (value) => {
		const cleaned = value.replace(/\D/g, '').slice(0, 16);
		return cleaned.replace(/(.{4})/g, '$1 ').trim();
	};

	const formatExpiry = (value) => {
		const cleaned = value.replace(/\D/g, '').slice(0, 4);
		if (cleaned.length <= 2) {
			return cleaned;
		}

		return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
	};

	const handleExpiryChange = (value) => {
		const cleaned = value.replace(/\D/g, '').slice(0, 4);
		const monthDigits = cleaned.slice(0, 2);
		const yearDigits = cleaned.slice(2, 4);

		if (monthDigits.length === 1) {
			if (monthDigits !== '0' && monthDigits !== '1') {
				return;
			}
		}

		if (monthDigits.length === 2) {
			const monthNumber = Number(monthDigits);
			if (monthNumber < 1 || monthNumber > 12) {
				return;
			}
		}

		if (yearDigits.length === 1) {
			const firstYearDigit = Number(yearDigits);
			if (firstYearDigit < 2) {
				return;
			}
		}

		if (yearDigits.length === 2) {
			const yearNumber = Number(yearDigits);
			if (yearNumber <= 25) {
				return;
			}
		}

		setExpiryDate(formatExpiry(cleaned));
	};

	const handlePay = async () => {
		if (!agreeTerms) {
			Alert.alert('Terms & Conditions', 'Please agree to the Terms & Conditions.');
			return;
		}

		if (!registerData) {
			Alert.alert('Registration data missing', 'Please complete registration again before payment.');
			navigation.navigate('Register');
			return;
		}

		if (paymentMethod !== 'card') {
			Alert.alert('Payment method', 'Please select card payment.');
			return;
		}

		if (cardNumber.replace(/\s/g, '').length < 16) {
			Alert.alert('Card number', 'Please enter a valid 16-digit card number.');
			return;
		}

		if (expiryDate.length !== 5) {
			Alert.alert('Expiration date', 'Please enter expiry date in MM/YY format.');
			return;
		}

		const expiryMatch = expiryDate.match(/^(\d{2})\/(\d{2})$/);
		if (!expiryMatch) {
			Alert.alert('Expiration date', 'Please enter expiry date in MM/YY format.');
			return;
		}

		const month = Number(expiryMatch[1]);
		const year = Number(expiryMatch[2]);

		if (month < 1 || month > 12) {
			Alert.alert('Expiration date', 'Month must be between 01 and 12.');
			return;
		}

		if (year <= 25) {
			Alert.alert('Expiration date', 'Year must be greater than 25.');
			return;
		}

		if (cvv.length < 3) {
			Alert.alert('CVV', 'Please enter a valid CVV.');
			return;
		}

		setIsPaying(true);
		try {
			const response = await fetch(`${API_BASE_URL}/api/mobile/register-and-pay`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					...registerData,
					payment: {
						method: paymentMethod,
						includeMonthFee,
						totalAmount,
						cardNumber,
						expiryDate,
						cvv,
						termsAccepted: agreeTerms,
						saveCardDetails,
					},
				}),
			});

			let result = null;
			try {
				result = await response.json();
			} catch (_jsonError) {
				result = null;
			}

			if (!response.ok) {
				const errorMessage =
					result && result.message
						? result.message
						: 'Failed to complete registration and payment.';
				throw new Error(errorMessage);
			}

			Alert.alert('Payment successful', `You paid LKR ${totalAmount}.`, [
				{
					text: 'OK',
					onPress: () => navigation.navigate('SignIn'),
				},
			]);
		} catch (error) {
			Alert.alert('Payment failed', error && error.message ? error.message : 'Please try again.');
		} finally {
			setIsPaying(false);
		}
	};

	return (
		<SafeAreaView style={styles.screen}>
			<StatusBar barStyle="light-content" backgroundColor="#111827" />
			<ScrollView contentContainerStyle={styles.scrollContainer}>
				<View style={styles.topHeaderRow}>
					<TouchableOpacity
						style={styles.backButton}
						activeOpacity={0.85}
						onPress={() => navigation.goBack()}
					>
						<Text style={styles.backButtonText}>{'Back'}</Text>
					</TouchableOpacity>
				</View>

				<View style={styles.termsCard}>

                    
					<Text style={styles.termsTitle}>Terms & Conditions</Text>
					<View style={styles.divider} />
					<Text style={styles.termsItem}>* No refunds after payment.</Text>
					<Text style={styles.termsItem}>* Enter correct payment details.</Text>
                    <Text style={styles.termsItem}>* Payment is required to activate membership.</Text>
                    <Text style={styles.termsItem}>* Participation is mandatory within seven days from the date of payment.</Text>

					<TouchableOpacity
						style={styles.termsAgreeRow}
						activeOpacity={0.85}
						onPress={() => setAgreeTerms((prev) => !prev)}
					>
						<View style={agreeTerms ? styles.termsChecked : styles.termsBox}>
							{agreeTerms ? <Text style={styles.checkMark}>✓</Text> : null}
						</View>
						<Text style={styles.termsAgreeText}>I agree to the Terms & Conditions</Text>
					</TouchableOpacity>
				</View>

				<View style={styles.card}>
					<Text style={styles.title}>Payment</Text>
					<View style={styles.divider} />

					<View style={styles.topRow}>
						<View style={[styles.topColumn, styles.topColumnLeft]}>
							<Text style={styles.sectionTitle}>Pay With:</Text>
							<TouchableOpacity
								style={styles.optionRow}
								activeOpacity={0.85}
								onPress={() => setPaymentMethod('card')}
							>
								<View style={styles.radioOuter}>
									{paymentMethod === 'card' ? <View style={styles.radioInner} /> : null}
								</View>
								<Text style={styles.optionText}>Card</Text>
							</TouchableOpacity>

							<View style={styles.brandRow}>
								<View style={styles.masterWrap}>
									<View style={[styles.masterCircle, styles.masterLeft]} />
									<View style={[styles.masterCircle, styles.masterRight]} />
								</View>
								<Text style={styles.visaText}>VISA</Text>
							</View>
						</View>

						<View style={styles.topColumn}>
							<Text style={styles.sectionTitle}>Pay are Made:</Text>

							<View style={styles.optionRowBetween}>
								<Text style={styles.optionText}>Admission Fee</Text>
								<View style={styles.checkboxChecked}>
									<Text style={styles.checkMark}>✓</Text>
								</View>
							</View>

							<TouchableOpacity
								style={styles.optionRowBetween}
								activeOpacity={0.85}
								onPress={() => setIncludeMonthFee((prev) => !prev)}
							>
								{/* <Text style={styles.optionText}>Month Fee</Text> */}
								{/* <View style={includeMonthFee ? styles.checkboxChecked : styles.checkboxEmpty}>
									{includeMonthFee ? <Text style={styles.checkMark}>✓</Text> : null}
								</View> */}
							</TouchableOpacity>
						</View>
					</View>

					<View style={styles.fieldBlock}>
						<Text style={styles.label}>Card Number</Text>
						<View style={styles.inputWithBrand}>
							<TextInput
								value={cardNumber}
								onChangeText={(value) => setCardNumber(formatCardNumber(value))}
								placeholder="5399 0000 0000 0000"
								placeholderTextColor="#9AA0A6"
								keyboardType="number-pad"
								style={styles.mainInput}
							/>
							<View style={styles.masterWrap}>
								<View style={[styles.masterCircle, styles.masterLeft]} />
								<View style={[styles.masterCircle, styles.masterRight]} />
							</View>
						</View>
					</View>

					<View style={styles.halfRow}>
						<View style={[styles.halfField, styles.halfFieldLeft]}>
							<Text style={styles.label}>Expiration Date</Text>
							<TextInput
								value={expiryDate}
								onChangeText={handleExpiryChange}
								placeholder="MM/YY"
								placeholderTextColor="#9AA0A6"
								keyboardType="number-pad"
								style={styles.input}
							/>
						</View>

						<View style={styles.halfField}>
							<Text style={styles.label}>CVV</Text>
							<TextInput
								value={cvv}
								onChangeText={(value) => setCvv(value.replace(/\D/g, '').slice(0, 3))}
								placeholder="***"
								placeholderTextColor="#9AA0A6"
								keyboardType="number-pad"
								secureTextEntry
								style={styles.input}
							/>
						</View>
					</View>

					<TouchableOpacity
						style={styles.saveRow}
						activeOpacity={0.85}
						onPress={() => setSaveCardDetails((prev) => !prev)}
					>
						<View style={saveCardDetails ? styles.saveChecked : styles.saveBox}>
							{saveCardDetails ? <Text style={styles.saveMark}>✓</Text> : null}
						</View>
						<Text style={styles.saveText}>Save card details</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[
							styles.payButton,
							(!agreeTerms || isPaying) && styles.payButtonDisabled,
						]}
						activeOpacity={agreeTerms && !isPaying ? 0.9 : 1}
						onPress={handlePay}
						disabled={!agreeTerms || isPaying}
					>
						<Text style={styles.payText}>
							{isPaying ? 'Processing...' : `Pay LKR ${totalAmount}`}
						</Text>
					</TouchableOpacity>

					<Text style={styles.noteText}>
						Your personal data will be used to process your order and improve your app
						experience according to our privacy policy.
					</Text>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		backgroundColor: '#111827',
	},
	scrollContainer: {
		flexGrow: 1,
		justifyContent: 'flex-end',
		paddingTop: 24,
		paddingBottom: 20,
		paddingHorizontal: 16,
	},
	topHeaderRow: {
		width: '100%',
		alignItems: 'flex-start',
		marginBottom: 10,
	},
	backButton: {
		width: 56,
		height: 30,
		borderRadius: 18,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#1F2937',
		borderWidth: 1,
		borderColor: '#374151',
	},
	backButtonText: {
		fontSize: 12,
		lineHeight: 22,
		fontWeight: '700',
		color: '#FFFFFF',
	},
	card: {
		width: '100%',
		alignSelf: 'center',
		marginTop: 16,
		backgroundColor: '#191e28',
		borderRadius: 8,
		padding: 16,
		shadowColor: '#000000',
		shadowOpacity: 0.06,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 4 },
		elevation: 2,
	},
	termsCard: {
		width: '100%',
		alignSelf: 'center',
		backgroundColor: '#191e28',
		borderRadius: 8,
		padding: 14,
		borderWidth: 1,
		borderColor: '#2A3343',
	},
	termsTitle: {
		fontSize: 20,
		fontWeight: '700',
		color: '#FFFFFF',
		marginBottom: 8,
	},
	termsItem: {
		fontSize: 13,
		fontWeight: '500',
		color: '#D1D5DB',
		lineHeight: 18,
		marginBottom: 4,
	},
	termsAgreeRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 8,
	},
	termsBox: {
		width: 20,
		height: 20,
		borderRadius: 4,
		borderWidth: 1,
		borderColor: '#9CA3AF',
		backgroundColor: '#191e28',
		marginRight: 10,
	},
	termsChecked: {
		width: 20,
		height: 20,
		borderRadius: 4,
		backgroundColor: '#2DC46B',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 10,
	},
	termsAgreeText: {
		flex: 1,
		fontSize: 12,
		fontWeight: '600',
		color: '#FFFFFF',
	},

    // Payment part css
	title: {
		fontSize: 20,
		fontWeight: '700',
		color: '#ffffff',
		marginBottom: 8,
	},
	divider: {
		height: 1,
		backgroundColor: '#dbd1d1',
		marginBottom: 18,
	},
	topRow: {
		flexDirection: 'row',
		marginBottom: 18,
	},
	topColumn: {
		flex: 1,
	},
	topColumnLeft: {
		marginRight: 16,
	},
	sectionTitle: {
		fontSize: 12,
		fontWeight: '700',
		color: '#ffffff',
		marginBottom: 10,
	},
	optionRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 12,
	},
	optionRowBetween: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 12,
	},
	optionText: {
		fontSize: 12,
		fontWeight: '600',
		color: '#ffffff',
	},
	radioOuter: {
		width: 20,
		height: 20,
		borderRadius: 10,
		borderWidth: 2,
		borderColor: '#2DC46B',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 10,
	},
	radioInner: {
		width: 10,
		height: 10,
		borderRadius: 5,
		backgroundColor: '#2DC46B',
	},
	brandRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 4,
	},
	masterWrap: {
		width: 38,
		height: 24,
		marginRight: 8,
		position: 'relative',
	},
	masterCircle: {
		width: 24,
		height: 24,
		borderRadius: 12,
		position: 'absolute',
		top: 0,
	},
	masterLeft: {
		left: 0,
		backgroundColor: '#EB001B',
	},
	masterRight: {
		left: 14,
		backgroundColor: '#F79E1B',
		opacity: 0.95,
	},
	visaText: {
		fontSize: 22,
		fontWeight: '800',
		color: '#083dce',
		letterSpacing: 1,
	},
	checkboxChecked: {
		width: 22,
		height: 22,
		borderRadius: 4,
		backgroundColor: '#2DC46B',
		alignItems: 'center',
		justifyContent: 'center',
	},
	checkboxEmpty: {
		width: 22,
		height: 22,
		borderRadius: 4,
		borderWidth: 1,
		borderColor: '#9CA3AF',
		backgroundColor: '#FFFFFF',
	},
	checkMark: {
		color: '#FFFFFF',
		fontSize: 12,
		fontWeight: '700',
	},
	fieldBlock: {
		marginBottom: 14,
	},
	label: {
		fontSize: 12,
		fontWeight: '600',
		color: '#ffffff',
		marginBottom: 8,
	},
	inputWithBrand: {
		borderWidth: 1,
		borderColor: '#BFC5CC',
		borderRadius: 8,
		height: 52,
		paddingHorizontal: 12,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: '#191e28',
	},
	mainInput: {
		flex: 1,
		color: '#ffffff',
		fontSize: 12,
		fontWeight: '500',
	},
	halfRow: {
		flexDirection: 'row',
		marginBottom: 14,
	},
	halfField: {
		flex: 1,
	},
	halfFieldLeft: {
		marginRight: 12,
	},
	input: {
		borderWidth: 1,
		borderColor: '#BFC5CC',
		borderRadius: 8,
		height: 48,
		paddingHorizontal: 12,
		fontSize: 12,
		color: '#ffffff',
		fontWeight: '500',
		backgroundColor: '#191e28',
	},
	saveRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 22,
	},
	saveBox: {
		width: 22,
		height: 22,
		borderRadius: 4,
		borderWidth: 1,
		borderColor: '#BFC5CC',
		backgroundColor: '#191e28',
		marginRight: 10,
	},
	saveChecked: {
		width: 22,
		height: 22,
		borderRadius: 4,
		backgroundColor: '#2DC46B',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 10,
	},
	saveMark: {
		color: '#FFFFFF',
		fontSize: 12,
		fontWeight: '600',
	},
	saveText: {
		color: '#9CA3AF',
		fontSize: 12,
		fontWeight: '500',
	},
	payButton: {
		height: 50,
		borderRadius: 6,
		backgroundColor: '#2DC46B',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 18,
	},
	payButtonDisabled: {
		backgroundColor: '#3F4A5C',
		opacity: 0.7,
	},
	payText: {
		color: '#FFFFFF',
		fontSize: 15,
		fontWeight: '700',
	},
	noteText: {
		color: '#B2B8BF',
		fontSize: 12,
		lineHeight: 18,
		fontWeight: '400',
	},
});
