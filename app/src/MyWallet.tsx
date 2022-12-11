import React, {useState, useEffect} from 'react';
import {
    useAnchorWallet,
    useConnection,
    useWallet,
} from '@solana/wallet-adapter-react';
import {
    WalletModalProvider,
    WalletDisconnectButton,
    WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';
import md5 from "md5";
import * as anchor from "@project-serum/anchor";
import {Keypair, PublicKey, SystemProgram} from "@solana/web3.js";
import {Program} from "@project-serum/anchor";
import BasicOwnershipIdl from "./idl/basic_ownership.json";
import {Button} from "@solana/wallet-adapter-react-ui/lib/Button";
import * as bs58 from 'bs58';

const MyWallet: React.FC = () => {
    const { connection } = useConnection();
    const programId = 'AtJQsbbEmsKRAsTN3bAfwpLn3w6gYDwMwerJVqTv1AJD'

    // if you use anchor, use the anchor hook instead
    const wallet = useAnchorWallet();
    const walletAddress = wallet?.publicKey.toString();


    const [fingerprintData, setFingerprintData] = useState<number[]>([])
    const [stringAccount, setStringAccount] = useState<Keypair | null>(null)
    const [owner, setOwner] = useState<string>('')
    const [toAddress, setToAddress] = useState<string>()
    const md5ExtendByte = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

    const fetchOwnership = async () => {
        if(wallet && stringAccount) {
            const provider = new anchor.Provider(connection, wallet, {
                preflightCommitment: "recent",
                commitment: "processed",
            });
            const program = new Program(BasicOwnershipIdl as any, programId, provider);
            try {
                const ownership = await program.account.ownership.fetch(stringAccount.publicKey);
                setOwner(ownership.owner.toString());
            } catch (e) {
                setOwner('')
            }
        }
    }

    useEffect(() => {
        fetchOwnership()
    }, [stringAccount])
    return (
        <>
            {wallet &&
                <p>Your wallet is {walletAddress}</p> ||
                <p>Hello! Click the button to connect</p>
            }

            <div className="multi-wrapper">
                <span className="button-wrapper">
                    <WalletModalProvider>
                        <WalletMultiButton />
                    </WalletModalProvider>
                </span>
                {wallet && <>
                    <br/>
                    <input type="file" onChange={async (file) => {
                        if (file.target.files && file.target.files.length) {
                            const blob = new Uint8Array(await file.target.files[0].arrayBuffer())
                            const md5StringData = md5(blob, {asBytes: true})
                            const _stringAccount = anchor.web3.Keypair.fromSeed(new Uint8Array(md5StringData.concat(md5ExtendByte)));
                            setFingerprintData(md5StringData)
                            setStringAccount(_stringAccount)
                            await fetchOwnership()
                        }
                    }} multiple={false}/>
                    {stringAccount && (owner === '' ? <>
                        <p><b>Your file not have fingerprint</b></p>
                        <Button onClick={async () => {
                            const provider = new anchor.Provider(connection, wallet, {
                                preflightCommitment: "recent",
                                commitment: "processed",
                            });
                            const program = new Program(BasicOwnershipIdl as any, programId, provider);
                            await program.rpc.initialize(
                                fingerprintData,
                                wallet?.publicKey,
                                {
                                    accounts: {
                                        ownership: stringAccount?.publicKey,
                                        systemProgram: SystemProgram.programId,
                                        signer: wallet?.publicKey
                                    },
                                    signers: [stringAccount],
                                });
                            await fetchOwnership()
                        }
                        }>Create finger print</Button>
                    </>: <>
                        <p><b>Owner of your file is ({owner === walletAddress ? 'You': 'Not you'}): </b>{owner}</p>
                        {owner === walletAddress && <>
                            <label>Transfer to address: </label>
                            <input type='text' onChange={(event) => {
                                setToAddress(event.target.value)
                            }}/>
                            <Button onClick={async () => {
                                if(toAddress) {
                                    const toAddressBase58 = bs58.decode(toAddress)
                                    const provider = new anchor.Provider(connection, wallet, {
                                        preflightCommitment: "recent",
                                        commitment: "processed",
                                    });
                                    const program = new Program(BasicOwnershipIdl as any, programId, provider);
                                    await program.rpc.transfer(
                                        new PublicKey(toAddressBase58),
                                        {
                                            accounts: {
                                                ownership: stringAccount.publicKey,
                                                systemProgram: SystemProgram.programId,
                                                signer: provider.wallet.publicKey
                                            },
                                            signers: [],
                                        });
                                    await fetchOwnership()
                                }
                            }}>Transfer owner ship</Button>
                        </>}
                    </>)}
                    <WalletDisconnectButton />
                </>
                }
            </div>
        </>
    )
};

export default MyWallet;
