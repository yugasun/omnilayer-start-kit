#!/usr/bin/env bash

######
# Now the type of our all tx is simple send, so we just make a simple send below.
####

# -e: when the return of command is unequal 0, shell will be exited.
set -e

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
echo "Receiver: "$receiver_address

# will transfer new coin amount, set it by yourself
yuga_amount=10

# generate omni layer payload for new coin tx
payload=`omnicore-cli omni_createpayload_simplesend $property_id $yuga_amount` 
echo "Payload: "$payload

######################## Create Transaction
echo "Start Create Transacion -------"

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
echo "Start Sign Transacion -------"
signed_transaction=`omnicore-cli signrawtransaction $transaction_output3 '[]' "[\"$sender_private_key\"]" | grep -e '"hex": "[^"]*"' | awk -F '"' '{print $4}'`
echo "Signed Result: \n"$signed_transaction

######################## Broadcast Transaction
echo "Start Broadcast Transacion -------"
transaction_hex=`omnicore-cli sendrawtransaction $signed_transaction`
echo "Transaction hex: "$transaction_hex

# blockchain confirm
omnicore-cli generate 1

# check receive address new coin balance
omnicore-cli omni_getbalance $receiver_address 3
echo "All done."