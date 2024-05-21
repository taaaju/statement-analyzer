import { group, first } from 'radash';

export const groupValues = (dataSet) => {
	return group(dataSet, (r) => {
		if (r != null && r.value != null) {
			if ( r['value']['value'] != null) {
				return r.value.value['identifier'];
			} else {
				return 'failed';
			}

		}
		return r; 
	});
}