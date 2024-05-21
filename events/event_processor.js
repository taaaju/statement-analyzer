import { v4 as uuidv4 } from 'uuid';
import EventEmitter from 'node:events';
import { formatValues } from '../utils/formatter.js';
import { inserter } from '../database/index.js';


// https://github.com/vitaly-t/pg-monitor
// use pg-monitor for monitoring... 


export const eventEmitter = new EventEmitter();

const sync = (list, category) => {
	const bvns = []
	const nins = []

	for (var i = list.length - 1; i >= 0; i--) {
		if (list[i]['type'] == 'bvn') {
			bvns.push(
				formatValues(list[i]['response']['data'], category)
			);
		}

		if (list[i]['type'] == 'nin') {
			nins.push(
				formatValues(list[i]['response']['data'], category)
			);
		}
	}


	if (bvns.length > 0) {
		inserter(bvns, 'bvn');
	}

	if (nins.length > 0) {
		inserter(nins, 'nin');
	}

}

const syncWithIssues = (issues, category) => {
	if (issues.length > 0) {
		for (var i = issues.length - 1; i >= 0; i--) {
			issues[i]['id'] = uuidv4();
		}
		inserter(issues, 'issues');
	}
}


eventEmitter.on('processor-success', (successes) => {
  console.log('successes', successes);
	sync(successes, 'not-matched');

});


eventEmitter.on('processor-errors', (errors) => {
  // console.log('errors', errors);
	syncWithIssues(errors, 'not-matched');
});

eventEmitter.on('processor-not-matched', (notMatched) => {
  // console.log('not-matched', notMatched);
	syncWithIssues(notMatched, 'not-matched');
});
