### Details items we still need to iterate on for the data processor 

- If database connection is down after fetching data from providers, what do we do. just LOG SUCH THINGS or ...
- Connection establishment times need to be short. Essentially, if the http request or database request TCP ACK is not successful within a few milliseconds, then the request should fail... FAIL FAST


### Comaprisons

BVN Search
NIN Search


CRC checks

### Scenarios

- Only BVN and account number is provided
- Only NIN and account number is provided
- Only phone number and account number is provided
- BVN, NIN, phone number and account number is provided