import {v4 as uuidv4} from 'uuid';

const nibssFormatter = (data, category) => {
	if (data != null) {
		const newData = {id: uuidv4(), sync_category: category};
		const keys = Object.keys(data);
		for (var i = keys.length - 1; i >= 0; i--) {
			newData[toLower(keys[i])] = data[keys[i]];
		}
		return newData;
	}
	return data;
}

const youVerifyFormatter = (data, category) => {
	if (data != null) {
		const newData = {id: uuidv4(), sync_category: category};
		const keys = Object.keys(data);
		for (var i = keys.length - 1; i >= 0; i--) {
			if (keys[i] != null && toLower(keys[i]).includes("address")) {
				const addressKeys = Object.keys(data[keys[i]]);

				for (var j = addressKeys.length - 1; j >= 0; j--) {

					// console.log(addressKeys)

					const k = keys[i] + "_" + addressKeys[j];


					newData[toLower(k)] = data[keys[i]][addressKeys[j]];
				}
			} else if (keys[i] != null && toLower(keys[i]) == "id") {
				// console.log(data[keys[i]])
			} else if (keys[i] != null && (toLower(keys[i]).includes("requestedby") || toLower(keys[i]).includes("validations"))) {
				newData[toLower(keys[i])] = JSON.stringify(data[keys[i]]);
			} else {
				newData[toLower(keys[i])] = data[keys[i]];				
			}
		}

		return newData;
	}
	return data;
}


const toLower = (v) => {
	return v.toLowerCase();
}


export const formatValues = (data, category) => {
	// return nibssFormatter(data, category);
	return youVerifyFormatter(data, category);
}
