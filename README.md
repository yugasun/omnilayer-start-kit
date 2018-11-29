# OmniLayer Start kit

A OmniLayer chain start kit.

## Prepare docker environment

Before building your own `omnicore` image, you can modify `bitcoin.conf` file depend on your requirement.

```bash
# 1. build docker image
docker build -t omni:3.1 .

# 2. start omnicore image
docker run -itd -p 8080:8080 --name=omni omni:3.1
```

After you start your omnicore container, you need login on your omni container and start omnicore service:

```bash
# login on omni image
docker exec -it omni bash

# start omnicore service
omnicored
```

## Develop

Now you can do anything you want with the omnicore chain.

### Issue new coin

```bash
# btc mining
omnicore-cli generate 100

# generate owner address
address=`omnicore-cli getnewaddress`

# store owner address
echo $address > /root/owner-address

# and bitcoin to owner address
omnicore-cli sendtoaddress $address 1

# set owner address account name, this is for omnicore-cli getbalance command
omnicore-cli setaccount $address owner

# check owner bitcoin balance
omnicore-cli getbalance owner

# blockchain confirm
omnicore-cli generate 1

###
# Create new coin
#omni_sendissuancefixed "fromaddress" ecosystem type previousid "category" "subcategory" "name" "url" "data" "amount"
#Create new tokens with fixed supply.

#    Arguments:
#    1. fromaddress          (string, required) the address to send from
#    2. ecosystem            (string, required) the ecosystem to create the tokens in (1 for main ecosystem, 2 for test ecosystem)
#    3. type                 (number, required) the type of the tokens to create: (1 for indivisible tokens, 2 for divisible tokens)
#    4. previousid           (number, required) an identifier of a predecessor token (use 0 for new tokens)
#    5. category             (string, required) a category for the new tokens (can be "")
#    6. subcategory          (string, required) a subcategory for the new tokens  (can be "")
#    7. name                 (string, required) the name of the new tokens to create
#    8. url                  (string, required) an URL for further information about the new tokens (can be "")
#    9. data                 (string, required) a description for the new tokens (can be "")
#    10. amount              (string, required) the number of tokens to create
#    
#    Result:
#    "hash"                  (string) the hex-encoded transaction hash
###
omnicore-cli omni_sendissuancefixed $address 1 2 0 "yugaCategory" "yugaSubcategory" "yuga" "www.yuga.com" "yuga for test" "100000"

# blockchain confirm
omnicore-cli generate 1
```

> **Notice:** If you don't want to exec the command one by one, you can use `/root/issue-new-coin.sh` directly.

### Create transaction

```bash
######################## Prepare Transaction
echo "Start Prepare Transaction -------"
# this command is depend on issue-new-coin.sh, where owner address store
sender_address=`cat /root/owner-address`

# new coin property id, it depends.
property_id=3

# dust value it is suggested to be 546, it will be sent to target address
dust_value=0.00000546

# unspent bitcoin amount
bitcoin_amount=0.1

# change bitcoin amount
change_amount=0.099

# prepare tx bitcoin fee for new coin tx
pre_transaction=`omnicore-cli sendtoaddress $sender_address $bitcoin_amount`
echo "Unspent: "$pre_transaction

# blockchain confirm
omnicore-cli generate 1

# dump sender private key, if you have just write it directly
sender_private_key=`omnicore-cli dumpprivkey $sender_address`

# generate receive new coin address
receiver_address=`omnicore-cli getnewaddress`
echo "Receiver: "$receiver_address ## mvoHVB9V9WkudWwrz7qabdn7XRLysvUFvo

# will transfer new coin amount, set it by yourself
yuga_amount=10

# generate omni layer payload for new coin tx
payload=`omnicore-cli omni_createpayload_simplesend $property_id $yuga_amount` 
echo "Payload: "$payload

######################## Create Transaction
echo "Start Create Transaction -------"

# add tx input -> vin
transaction_input=`omnicore-cli omni_createrawtx_input "" $pre_transaction 0`

# add dust tx output for receiver address, this must go before payload tx output
transaction_output1=`omnicore-cli omni_createrawtx_reference $transaction_input $receiver_address $dust_value`

# add payload tx output
transaction_output2=`omnicore-cli omni_createrawtx_opreturn $transaction_output1 $payload`

# add change tx output, this is omnicore_raw_transaction
transaction_output3=`omnicore-cli omni_createrawtx_reference $transaction_output2 $sender_address $change_amount`
echo "Omni tx: "$transaction_output3;
echo "Raw transaction created"

######################## Sign Transaction
echo "Start Sign Transaction -------"
signed_transaction=`omnicore-cli signrawtransaction $transaction_output3 '[]' "[\"$sender_private_key\"]" | grep -e '"hex": "[^"]*"' | awk -F '"' '{print $4}'`
echo "Signed Result: \n"$signed_transaction

######################## Broadcast Transaction
echo "Start Broadcast Transaction -------"
transaction_hex=`omnicore-cli sendrawtransaction $signed_transaction`
echo "Transaction hex: "$transaction_hex

# blockchain confirm
omnicore-cli generate 1

# check receive address new coin balance
omnicore-cli omni_getbalance $receiver_address 3
echo "All done."
```

> **Notice:** If you don't want to exec the command one by one, you can use `/root/create-tx.sh` directly.


## OmniLayer Payload Introduction

``` bash
# a standard payload format for simple send tx
6f6d6e69000000000000001f000000003b9aca00
```

> * Omni prefix: `6f6d6e69` which can not be modifed.
> * Proterty Id: `000000000000001f` -> `31` is for master chain `Tether(USDT)`, you can modified it depends on your omni coin property id. For example when you create regtest chain, your first omni coin property id will be `3`, so you need change to `0000000000000003`.
> * Transfer Amount: `000000003b9aca00` -> is `10 * 10000000` omni coin amount in hex.

## Transfer Coins (Simple Send)

> This paragraph is copy from [official specs](https://github.com/OmniLayer/spec#transfer-coins-simple-send)

Description: Transaction type 0 transfers coins in the specified currency from the sending address to the reference address, defined in Appendix A. This transaction can not be used to transfer bitcoins.

In addition to the validity constraints on the message field datatypes, the transaction is invalid if any of the following conditions is true:

* the sending address has zero coins in its available balance for the specified currency identifier
* the amount to transfer exceeds the number owned and available by the sending address
* the specified currency identifier is non-existent
* the specified currency identifier is 0 (bitcoin)

A Simple Send to a non-existent address will destroy the coins in question, just like it would with bitcoin.

## License

MIT