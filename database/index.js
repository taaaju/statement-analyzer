import pgPromise from 'pg-promise';
import { getSecrets } from '../secrets/index.js';

const secrets = await getSecrets();

const cn = secrets['database-connection'];

const config = {
  connectionString: cn,
  max: 5,
  keepAlive: true
}

// const pgp = pgPromise(config);
const pgp = pgPromise();

const db = pgp(config);


const bvn = new pgp.helpers.ColumnSet(["id", "image", "requestedby", "sync_category", "metadata", "fulldetails", "nameoncard", "watchlisted", "stateoforigin", "othermobile", "lgaoforigin", "maritalstatus", "title", "address_addressline", "address_state", "address_lga", "address_town", "levelofaccount", "gender", "registrationdate", "email", "lastmodifiedat", "createdat", "country", "requestedat", "type", "shouldretrivednin", "isconsent", "dateofbirth", "mobile", "enrollmentinstitution", "enrollmentbranch", "lastname", "firstname", "reason", "status"], {table: 'data_extractor_youverify_bvns'});

const nin = new pgp.helpers.ColumnSet(["id", "allvalidationpassed", "parentid", "middlename", "idnumber", "businessid", "datavalidation", "selfievalidation", "sync_category", "consent", "status", "reason", "firstname", "lastname", "image", "signature", "mobile", "email", "birthstate", "nokstate", "religion", "birthlga", "birthcountry", "dateofbirth", "type", "gender", "country", "createdat", "lastmodifiedat", "isconsent",  "address_lga", "address_town", "address_state", "address_addressline"], {table: 'data_extractor_youverify_nins'});

const issues = new pgp.helpers.ColumnSet(["id", "account_number", "bvn", "nin", "bvn_response", "nin_response", "message"], {table: 'data_extractor_issues'});


const insertHelpers = {
  'bvn': bvn,
  'nin': nin,
  'issues': issues
}

const conflictHelpers = {
  'bvn': ' ON CONFLICT (account_number) DO NOTHING',
  'nin': ' ON CONFLICT (account_number) DO NOTHING',
  'issues': ' ON CONFLICT (account_number) DO NOTHING'
}

const defaultOrValue = (v) => {
  if (v == null) {
    return '';
  }
  return v;
}


export const inserter = async (values, type) => {
  // console.log(values, type)



  const query = pgp.helpers.insert(values, insertHelpers[type]);
  // console.log(query)

  await db.none(query + ' ' + defaultOrValue(null));
} 

