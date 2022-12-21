
let req = {
    filters: {
      forAll: [
        {
          valRange: {
            range: [1000],
            cur: "USD"
          },
          require: [
            {
              type: "KYC",
              level: "ZK"
            },
            {
              type: "2FA",
              provider: "authy"
            },
            { type: "PHONE", },
            {
              type: "CODE",
              tries: 1
            },
            {
              type: "MUTLISIG",
              otherSsigners: 2
            }
          ]
        }
      ]
    }
  }
  console.log(JSON.stringify(req))