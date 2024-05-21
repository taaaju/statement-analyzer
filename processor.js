import { group, first } from 'radash';
import { groupValues } from './utils/grouper.js';
import { eventEmitter } from './events/event_processor.js';


const bvnHasRequiredFields = (bvn) => {
	return bvn != null && bvn.hasOwnProperty('firstName') && bvn.hasOwnProperty('lastName') && bvn.hasOwnProperty('dateOfBirth');
}

const ninHasRequiredFields = (nin) => {
	return nin != null && nin.hasOwnProperty('firstName') && nin.hasOwnProperty('lastName') && nin.hasOwnProperty('dateOfBirth');
}

const detailsMatch = (a, b) => {
	return a != null && b != null && a.toLowerCase() == b.toLowerCase();
}

const bvnAndNinDetailsMatch = (bvn, nin) => {
	if (bvn != null && nin != null && bvnHasRequiredFields(bvn) && ninHasRequiredFields(nin)) {
		return detailsMatch(bvn['firstName'], nin['firstName']) && detailsMatch(bvn['lastName'], nin['lastName']) && detailsMatch(bvn['dateOfBirth'], nin['dateOfBirth']);
	}
	return false;
}

const parseResponseFrom = async (results) => {
	const parsed = results.map(async(r) => {
		const temp = await r.value['response'].json();
		r.value['response'] = temp;
		return r;
	});
	return Promise.allSettled(parsed);
}

const addToList = (items, list) => {
	for (var i = items.length - 1; i >= 0; i--) {
		if (items[i] != null) {
			if (items[i].hasOwnProperty('value') && items[i]['value'].hasOwnProperty('value')) {
				list.push(items[i].value.value);
			} else if (items[i].hasOwnProperty('value')) {
				list.push(items[i].value);
			} else {
				list.push(items[i]);
			}
		}
	}
}

export const processor = async (records) => {
	const errors = [];
	const notMatched = [];
	const success = [];

	const recordsBystatus = group(records, f => f.status);

	if (recordsBystatus['rejected']) {
		// https://github.com/node-fetch/node-fetch/blob/main/docs/ERROR-HANDLING.md
		// recordsBystatus['rejected'].forEach(r => {
		// 	console.log()
		// 	console.log()
		// 	console.log(r.name)
		// 	console.log(r.reason)

		// })
		// recordsBystatus['rejected'].forEach(r => errors.push(r.value));
		// eventEmitter.emit('processor-errors', errors);
	}

	if (recordsBystatus['fulfilled']) {
		const settled = await parseResponseFrom(recordsBystatus['fulfilled']);
			const grouped = groupValues(settled);

			const keys = Object.keys(grouped);

			keys.forEach( (k) => {
				if (k == 'failed') {
					addToList(grouped[k], errors);
				} else {
					if (grouped[k].length > 1) {
						let bvnResponse = null;
						let ninResponse = null;

						let bvn = null;
						let nin = null;
						let accountNumber = null;

						for (var i = grouped[k].length - 1; i >= 0; i--) {
							if (grouped[k][i].value.value.type == 'nin') {
								ninResponse = grouped[k][i].value.value;
							} else if (grouped[k][i].value.value.type == 'bvn') {
								bvnResponse = grouped[k][i].value.value;
							} else {
								// errors.push(grouped[k][i].value.value);
							}
							if (accountNumber == null && bvn == null && nin == null && grouped[k][i] != null && grouped[k][i].value != null && grouped[k][i].value.value != null) {
								bvn = grouped[k][i].value.value.request.bvn;
								nin = grouped[k][i].value.value.request.nin;
								accountNumber = grouped[k][i].value.value.request.account_number;
							}
						}

						let message = "The details in the nin and bvn details fetched for comparison did not match";
						let isAMatch = false;
						if (bvnResponse != null && ninResponse != null) {
							isAMatch = bvnAndNinDetailsMatch(bvnResponse, ninResponse);
						} else if (bvnResponse != null && ninResponse == null) {
							message = "Failed to fetch nin details for comparison";
						} else if (ninResponse != null && bvnResponse == null) {
							message = "Failed to fetch bvn details for comparison";
						}
						if (isAMatch) {
							success.push({account_number: accountNumber, bvn: bvn, nin: nin, bvn_response: JSON.stringify(bvnResponse), nin_response: JSON.stringify(ninResponse), message: 'success'});
						} else {
							notMatched.push({account_number: accountNumber, bvn: bvn, nin: nin, bvn_response: JSON.stringify(bvnResponse), nin_response: JSON.stringify(ninResponse), message: message});
						}
					} else {
						console.log("accountNumber " + accountNumber)
						for (var i = grouped[k].length - 1; i >= 0; i--) {
							notMatched.push({account_number: accountNumber, bvn: bvn, nin: nin, bvn_response: null, nin_response: null, message: "Failed to fetch details for comparison", response: JSON.stringify(grouped[k][i].value.value)});
						}
					}
				}
			});


			eventEmitter.emit('processor-errors', errors);
			eventEmitter.emit('processor-success', success);
			eventEmitter.emit('processor-not-matched', notMatched);
	}
}
