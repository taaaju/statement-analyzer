import AWS from "aws-sdk";

function calculateHarmonicMean(numbers) {
  if (!numbers) {
    return 0;
  }
  const reciprocalSum = numbers?.reduce((acc, num) => acc + 1 / num, 0);
  console.log(reciprocalSum, "reciprocal sum");
  return numbers.length / reciprocalSum;
}

function calculateTrimMean(numbers, trimPercentage) {
  if (!numbers) {
    return 0;
  }
  // console.log(numbers, "numbers");
  numbers?.sort((a, b) => a - b);
  // console.log(numbers, "sorted numbers");
  const trimCount = Math.floor(numbers.length * trimPercentage);
  // console.log(trimCount, "trim count");
  const trimmedNumbers = numbers.slice(trimCount, numbers.length - trimCount);
  // console.log(trimmedNumbers, "trimmed numbers");
  const sum = trimmedNumbers.reduce((acc, num) => acc + num, 0);
  // console.log(sum, numbers.length - 2, trimCount, "sum");
  const result = sum / (numbers.length - 2 * trimCount);
  if (!result) {
    return 0;
  }
  return result;
}

export const handler = async (event) => {
  function getConfidenceScore(largestCount) {
    let confidenceScore = 0;
    if (largestCount >= 6) {
      confidenceScore = 100;
    } else if (largestCount > 2) {
      confidenceScore = Math.round((largestCount / 6) * 100);
    }
    return confidenceScore;
  }

  const CODE_TO_SHOW = "LATO";
  try {
    // AWS.config.update({ region: "ca-central-1" });
    const keywords = [
      "SALARY",
      "SAL",
      "PAYROLL",
      // "PAY",
      "INCOME",
      // "INC",
      "ALLOWANCE",
      "STIPEND",
      "IPPIS",
      "REM",
      "ARMY",
      "NAVY",
      "ALLOWANCE",
      "WAGE",
      "NPF",
      "INCOME",
      "NEFT",
      "SUBEB",
      "RTGS",
    ];

    const s3 = new AWS.S3();
    // console.log(event.Records[0].s3, "event record");

    const objectName = event.Records[0].s3.bucket.name;
    const objectKey = event.Records[0].s3.object.key;

    const s3Object = await s3
      .getObject({ Bucket: objectName, Key: objectKey })
      .promise();
    const bufferAsString = s3Object.Body.toString("utf-8");
    // console.log(bufferAsString, "buffer as string");
    const bufferAsObject = JSON.parse(bufferAsString);
    // const bufferAsObject = bufferAsString[0].NARRATION;
    // console.log(bufferAsString[0], bufferAsString);
    const statements = Object.values(bufferAsObject);
    console.log(statements, "statements");

    if (CODE_TO_SHOW === "DEFAULT") {
      let statement = [];

      statements.forEach((data, index) => {
        const accountStatementByData = [];

        keywords.forEach((keyword) => {
          const statementByKeyword = data
            .filter(
              (item) => Number(item.TRAN_AMOUNT.replace(/,/g, "")) >= 30000
            )
            .filter((item) => {
              const narrationAsArray = item.NARRATION.split(" ");

              //check if keyword is exact match in narration
              if (
                item.NARRATION.toUpperCase().includes(keyword)
                // &&
                // narrationAsArray
                //   .map((item) => item.toUpperCase())
                //   .includes(keyword)
              ) {
                return item;
              }
            });

          accountStatementByData.push({
            keyword,
            dates: statementByKeyword.map((item) => item.TRAN_DATE),
            // salaryDateDeviation:,
            data: statementByKeyword,
            accountNumber: statementByKeyword[0]?.ACCOUNT_NUMBER,
            count: statementByKeyword.length,
            narration: statementByKeyword.map((item) => item.NARRATION),
            amount: statementByKeyword.map((item) => item.TRAN_AMOUNT),
            keywordType:
              keyword === "SALARY" ? "primary keyword" : "secondary keyword",
            confidenceScore: getConfidenceScore(statementByKeyword.length),
          });
        });

        //reconstruct the map function return to an object with key as keyword,data as the returned array, and count

        //explore the neural network approach in making the decision to give out the loan or not

        const salaryStatement = accountStatementByData.filter(
          (item) => item.keyword === "SALARY" && item.count > 2
        );

        if (salaryStatement.length) {
          //save to Database
          statement.push(salaryStatement[0]);
        } else {
          //pick secondary key word with highest count
          const secondaryKeywordStatement = accountStatementByData.filter(
            (item) => item.keywordType === "secondary keyword" && item.count > 2
          );

          if (!secondaryKeywordStatement.length) {
            return;
          }
          //note there is the likelihood of 2 or more secondary keywords being the highest count
          const counts = secondaryKeywordStatement.map((item) => item.count);
          const highestCount = Math.max(...counts);
          const secondaryKeywordStatementWithHighestCount =
            secondaryKeywordStatement.filter(
              (keyword) => keyword.count === highestCount
            );

          statement.push(secondaryKeywordStatementWithHighestCount[0]);
        }
      });

      const params = {
        Bucket: "variable-extraction-output",
        Key: `variable-extraction-output/keywords`,
        Body: JSON.stringify(statement),
        ContentType: "application/json; charset=utf-8",
      };
      await s3.putObject(params).promise();
      console.log("DEFAULT");
    }

    if (CODE_TO_SHOW === "OTHER") {
      let mayowaData = [];

      statements
        .filter((data) => data.length)
        .forEach((data, index) => {
          //logic for getting data before extraction
          // mayowaData.push({
          //   accountNumber: data[0]?.ACCOUNT_NUMBER,
          //   dates: data.map((item) => item.TRAN_DATE).slice(0, 7),
          //   amount: data.map((item) => item.TRAN_AMOUNT).slice(0, 7),
          //   narration: data.map((item) => item.NARRATION).slice(0, 7),
          // });

          const mayowaAccountStatementByData = [];
          keywords.forEach((keyword) => {
            const statementByKeyword = data
              .filter(
                (item) => Number(item.TRAN_AMOUNT.replace(/,/g, "")) >= 20000
              )
              .filter((item, index) => {
                const narrationAsArray = item?.NARRATION?.replace(
                  /\//g,
                  " "
                ).split(" ");

                //check if keyword is exact match in narration
                if (
                  item?.NARRATION?.toUpperCase().includes(keyword) &&
                  narrationAsArray
                    .map((item) => item.toUpperCase())
                    .includes(keyword)
                ) {
                  return item;
                } else {
                  // console.log(item, index, "item not found");
                }
              });

            if (statementByKeyword.length) {
              mayowaAccountStatementByData.push({
                keyword,
                accountNumber: statementByKeyword[0]?.ACCOUNT_NUMBER,
                count: statementByKeyword.length,
                narration: statementByKeyword.map((item) => item.NARRATION),
                averageAmount:
                  statementByKeyword
                    .map((item) => Number(item.TRAN_AMOUNT.replace(/,/g, "")))
                    .reduce((prevValue, currentVal) => prevValue + currentVal) /
                  statementByKeyword.length,
                keywordType:
                  keyword === "SALARY"
                    ? "primary keyword"
                    : "secondary keyword",
                confidenceScore: getConfidenceScore(statementByKeyword.length),
              });
            } else {
              // console.log(data, index, "item not found");
              //a conditional that checks if there is a keyword even when the user data does not pass the minimum wage filter can be added
              mayowaAccountStatementByData.push({
                keyword: "N/A",
                averageAmount:
                  data
                    .map((item) => Number(item.TRAN_AMOUNT.replace(/,/g, "")))
                    .reduce((prevValue, currentVal) => prevValue + currentVal) /
                  data.length,
                accountNumber: data[0]?.ACCOUNT_NUMBER,
                count: data.length,
                narration: data[0]?.NARRATION,
                keywordType: "Not found",
                confidenceScore: 0,
                isSalary: "NO",
              });
            }
          });

          //reconstruct the map function return to an object with key as keyword,data as the returned array, and count

          //explore the neural network approach in making the decision to give out the loan or not

          const mayowaSalaryStatement = mayowaAccountStatementByData.filter(
            (item) => item.keywordType === "primary keyword" && item.count > 2
          );

          const primaryKeywordNotSalary = mayowaAccountStatementByData.filter(
            (item) => item.keywordType === "primary keyword" && item.count <= 2
          );

          const mayowaSecondaryKeywordStatement =
            mayowaAccountStatementByData.filter(
              (item) =>
                item.keywordType === "secondary keyword" && item.count > 2
            );

          const secondaryKeywordNoSalary = mayowaAccountStatementByData.filter(
            (item) =>
              item.keywordType === "secondary keyword" && item.count <= 2
          );

          const notFoundSalaryStatement = mayowaAccountStatementByData.filter(
            (item) => item.keywordType === "Not found"
          );

          if (mayowaSalaryStatement.length) {
            //save to Database
            mayowaData.push({ ...mayowaSalaryStatement[0], isSalary: "YES" });
          } else {
            if (mayowaSecondaryKeywordStatement.length) {
              //pick secondary key word with highest count

              //note there is the likelihood of 2 or more secondary keywords being the highest count
              const counts = mayowaSecondaryKeywordStatement.map(
                (item) => item.count
              );
              const highestCount = Math.max(...counts);

              const mayowaSecondaryKeywordStatementWithHighestCount =
                mayowaSecondaryKeywordStatement.filter(
                  (keyword) => keyword.count === highestCount
                );

              mayowaData.push({
                ...mayowaSecondaryKeywordStatementWithHighestCount[0],
                isSalary: "YES",
              });
              return;
            }

            if (secondaryKeywordNoSalary.length) {
              //saves secondary keywords less than salary count of 2
              mayowaData.push({
                ...secondaryKeywordNoSalary[0],
                isSalary: "YES",
              });
              return;
            }

            if (primaryKeywordNotSalary.length) {
              //saves primary keywords less than salary count of 2
              mayowaData.push({
                ...primaryKeywordNotSalary[0],
                isSalary: "YES",
              });
              return;
            }
            //save keywords not found

            mayowaData.push({
              ...notFoundSalaryStatement[0],
              isSalary: "NO",
            });
          }
        });

      //create json
      const params2 = {
        Bucket: "variable-extraction-output",
        Key: `variable-extraction-output/mayowa-data`,
        Body: JSON.stringify(mayowaData),
        ContentType: "application/json; charset=utf-8",
      };
      await s3.putObject(params2).promise();
      // console.log("OTHER");
    }

    if (CODE_TO_SHOW === "LATO") {
      const latoData = [];
      statements.forEach((statement) => {
        const parsedStatement = JSON.parse(statement?.convert_from);
        const extractedCredit = parsedStatement?.Details?.map((detail) =>
          Number(detail?.PCredit?.replace(/,/g, ""))
        ).filter((credit) => credit > 0);
        console.log(extractedCredit, "extracted credit");
        const trimmedPercentage = 50 / 100;
        const trimMean = calculateTrimMean(extractedCredit, trimmedPercentage);
        let averageMean = null;
        if (extractedCredit && extractedCredit.length) {
          averageMean =
            extractedCredit?.reduce(
              (prevValue, currentVal) => prevValue + currentVal
            ) / extractedCredit?.length;
        }

        const harmonicMean = calculateHarmonicMean(extractedCredit);
        console.log(
          trimMean,
          harmonicMean,
          averageMean,
          "extracted credit mean"
        );
        latoData.push({
          trimMean,
          harmonicMean,
          averageMean: !averageMean ? 0 : averageMean,
          accountNumber: statement?.account_number,
        });
      });

      //create json
      const params2 = {
        Bucket: "variable-extraction-output",
        Key: `variable-extraction-output/lato-data`,
        Body: JSON.stringify(latoData),
        ContentType: "application/json; charset=utf-8",
      };
      await s3.putObject(params2).promise();
      console.log("LATO");
    }
  } catch (error) {
    console.log(error, "error");
  }
};
