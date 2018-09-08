import { SigningUtils, ErcDex } from '@ercdex/core';
import { PrivateKeyWalletSubprovider, RPCSubprovider } from '@0xproject/subproviders';
import { Web3Wrapper } from '@ercdex/core';
import { assetDataUtils, SignerType } from '0x.js';
import { BigNumber } from 'bignumber.js';

// tslint:disable-next-line
const ProviderEngine = require('web3-provider-engine');

ErcDex.Initialize({
    host: 'kovan-staging.ercdex.com'
});

(async () => {
    const provider = new ProviderEngine();

    const privateKey = 'MY-PRIVATE-KEY-WITHOUT-LEADING-0X';
    provider.addProvider(new PrivateKeyWalletSubprovider(privateKey));

    // switch to mainnet.infura.io if you want to target mainnet (e.g. on staging.ercdex.com or app.ercdex.com when it goes live)
    provider.addProvider(new RPCSubprovider('https://kovan.infura.io'));

    // you could just hardcode this if you want
    const exchangeAddress = await this.exchangeWrapper.getContractAddress()

    const makerAddress = 'MAKER-ADDRESS-GOES-HERE';
    const makerAssetAddress = 'MAKER-TOKEN-ADDRESS';
    const takerAssetAddress = 'TAKER-TOKEN-ADDRESS';
    const makerAssetAmount = '1000';
    const takerAssetAmount = '1000';

    // honestly, there's no need to call this because the return data is never going to really change for ERC dEX
    // could be worth calling every now and then and just caching since down the road we may change the senderAddress or something
    const orderConfig = await new ErcDex.Api.OrdersService().getOrderConfig({
        exchangeAddress,
        makerAddress,
        makerAssetAmount,
        takerAddress: '0x0000000000000000000000000000000000000000',
        takerAssetAmount,
        makerAssetData: assetDataUtils.encodeERC20AssetData(makerAssetAddress),
        takerAssetData: assetDataUtils.encodeERC20AssetData(takerAssetAddress)
    });

    const result = await SigningUtils.signOrder({
        exchangeAddress,
        provider,
        feeRecipientAddress: orderConfig.feeRecipientAddress,
        makerFee: new BigNumber(orderConfig.makerFee),
        takerFee: new BigNumber(orderConfig.takerFee),
        senderAddress: orderConfig.senderAddress,
        makerAddress: this.params.account,
        makerAssetAddress,
        takerAssetAddress,
        makerAssetAmount: new BigNumber(makerAssetAmount),
        takerAssetAmount: new BigNumber(takerAssetAmount),
        expirationTimeSeconds: new BigNumber(1636437014),
        signerType: SignerType.Default
    });

    // this is going to give you { order, signature }, where order is the order params and signature is the signed order string
    console.log(result);

    // you can post this however you want, this is what happens in @ercdex/core
    const { order, signature } = result;
    const createdOrder = await new ErcDex.Api.OrdersService().createOrder({
        request: {
            makerAddress,
            makerAssetData: order.makerAssetData,
            takerAssetData: order.takerAssetData,
            takerAddress: order.takerAddress,
            feeRecipientAddress: order.feeRecipientAddress,
            senderAddress: order.senderAddress,
            exchangeAddress: order.exchangeAddress,
            expirationTimeSeconds: order.expirationTimeSeconds.toString(),
            makerFee: order.makerFee.toString(),
            takerFee: order.takerFee.toString(),
            salt: order.salt.toString(),
            makerAssetAmount: order.makerAssetAmount.toString(),
            takerAssetAmount: order.takerAssetAmount.toString(),
            signature
        }
    });
    
    // here's your order
    console.log(createdOrder);
})();
