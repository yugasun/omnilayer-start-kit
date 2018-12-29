# OmniLayer Start kit

简体中文 | [English](./README.md)

一个搭建 `OmniLayer` 私链的工具。

## 准备环境

在你构建 `omnicore` 镜像之前，可以根据个人需求修改 `bitcoin.conf` 文件。

```bash
# 1. 构建 docker 镜像
docker build -t omni:3.1 .

# 2. 运行镜像
docker run -itd -p 8080:8080 --name=omni omni:3.1
```

在你的 omnicore 容器运行起来后，你还需要登录到 docker 容器中，启动 omnicore 服务：

```bash
# login on omni image
docker exec -it omni bash

# start omnicore service
omnicored
```

## 开发

现在你可以再你运行的私链中做任何你想做的事情。

### 发布一个新币

```bash
# 构建新币也是一个 bitcoin 交易，所以需要挖矿
omnicore-cli generate 100 >> /dev/null

# 生成新币 owner 地址
address=`omnicore-cli getnewaddress`

# 存储新币 owner 地址
echo $address > /root/owner-address

# 发送  1个比特币到 owner 地址
omnicore-cli sendtoaddress $address 1

# 设置 owner 地址账户名称，为了 omnicore-cli getbalance 来查看余额
omnicore-cli setaccount $address owner

# 查看 owner 账户 bitcoin 余额
omnicore-cli getbalance owner

# 区块挖矿确认
omnicore-cli generate 1

###
# 构建新币
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

# 区块挖矿确认
omnicore-cli generate 1
```

> **注意：** 如果你不想一行一行的执行命令，你可以直接通过运行 `/root/issue-new-coin.sh`。

### 构建交易

```bash
######################## 准备交易数据
echo "Start Prepare Transaction -------"
# 获取发送地址，依赖上面生成的 owner 地址，你也可以重新生成一个新地址
sender_address=`cat /root/owner-address`

# 新币的资产id, 识实际情况而定，一般默认是3
property_id=3

# dust 值（发送omni交易的最小BTC费用值），官方建议为 546，将发送到接受地址
dust_value=0.00000546

# 还未花掉的BTC数量
bitcoin_amount=0.1

# 找零BTC数量
change_amount=0.099

# 构建未花销 BTC 交易
pre_transaction=`omnicore-cli sendtoaddress $sender_address $bitcoin_amount`
echo "Unspent: "$pre_transaction

# 区块挖矿确认
omnicore-cli generate 1

# 获取发送方的私钥，如果你有，可以直接填写
sender_private_key=`omnicore-cli dumpprivkey $sender_address`

# 生成接受方的地址
receiver_address=`omnicore-cli getnewaddress`
echo "Receiver: "$receiver_address

# 将要发送的新币数量，可以任意设置，最小金额为 0.00000001
yuga_amount=10

# 生成 OmniLayer 链特有的 payload
payload=`omnicore-cli omni_createpayload_simplesend $property_id $yuga_amount`
echo "Payload: "$payload

######################## 创建交易
echo "Start Create Transaction -------"

# 添加 tx input -> vin
transaction_input=`omnicore-cli omni_createrawtx_input "" $pre_transaction 0`

# 为添加 dust 交易output，此步骤必须在 payload 交易的 output 之前
transaction_output1=`omnicore-cli omni_createrawtx_reference $transaction_input $receiver_address $dust_value`

# 添加 payload 的output
transaction_output2=`omnicore-cli omni_createrawtx_opreturn $transaction_output1 $payload`

# 添加找零交易输出，此处生成的就是 omnicore 原始交易 hash
transaction_output3=`omnicore-cli omni_createrawtx_reference $transaction_output2 $sender_address $change_amount`
echo "Omni tx: "$transaction_output3;
echo "Raw transaction created"

######################## 签名交易
echo "Start Sign Transaction -------"
signed_transaction=`omnicore-cli signrawtransaction $transaction_output3 '[]' "[\"$sender_private_key\"]" | grep -e '"hex": "[^"]*"' | awk -F '"' '{print $4}'`
echo "Signed Result: \n"$signed_transaction

######################## 广播交易
echo "Start Broadcast Transaction -------"
transaction_hex=`omnicore-cli sendrawtransaction $signed_transaction`
echo "Transaction hex: "$transaction_hex

# 区块挖矿确认
omnicore-cli generate 1

# 检查接受地址资产是否发生改变
omnicore-cli omni_getbalance $receiver_address 3
echo "All done."
```

> **注意：** 如果你不想一行一行执行命令，你可以直接使用 `/root/create-tx.sh` 文件。

## OmniLayer Payload 简介

``` bash
# 一个标准的 omni payload 格式
6f6d6e69000000000000001f000000003b9aca00
```

> * Omni 前缀: `6f6d6e69` 这里是固定的，不可修改。
> * 资产ID: `000000000000001f` -> `31` 是主链的 `Tether(USDT)` ID, 你可以根据你实际生成新币来修改。 比如上面你搭建的私链，生成的第一个 omni 币的资产ID是 `3`，因此你需要修改为 `0000000000000003`。
> * 交易金额: `000000003b9aca00` -> 等于 `10 * 10000000` 新币的数量。

## 简单交易规则

> 来自 [官方规范](https://github.com/OmniLayer/spec#transfer-coins-simple-send)

新币是一对一交易，由发送地址给接受地址新币。规则如下:

* 发送地址由 bitcoin 的交易中的index 为 0 的vin唯一确定。
* 当 bitcoin 的交易中的有效 vout 仅有一个时，接受地址由这个 vout 唯一确定。
* 当 bitcoin 的交易中的有效 vout 多于一个时，则去掉第一个与发送地址相同的 vout（若果有的话），取最后一个 vout 的地址作为接受地址。

## 专门为 nodejs 提供的 USDT controller

`src/usdt-controller.js` 是一个控制器工具，用来实现简单交易, 你可以用它来实现以下功能:

* 生成带有 WIF 的地址.
* 发送简单交易（包括BTC）.
* 获取目标地址的未使用交易.
* 广播原始交易数据.

[示例](./demo/app.js)

## License

MIT
