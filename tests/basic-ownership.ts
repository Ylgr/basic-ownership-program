import * as anchor from "@project-serum/anchor";
import {Program, workspace} from "@project-serum/anchor";
import { BasicOwnership } from "../target/types/basic_ownership";
import md5 from 'md5';
import {SystemProgram} from "@solana/web3.js";
import {assert} from "chai";

describe("basic-ownership", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.BasicOwnership as Program<BasicOwnership>;

  const md5ExtendByte = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  const stringCheck = "I am Nguyen Viet Tu";
  const md5StringData = md5(stringCheck, {asBytes: true});

  const stringAccount = anchor.web3.Keypair.fromSeed(new Uint8Array(md5StringData.concat(md5ExtendByte)));
  describe("Initialize", () => {
    it("Should success", async () => {
      await program.rpc.initialize(
          md5StringData,
          provider.wallet.publicKey,
          {
            accounts: {
              ownership: stringAccount.publicKey,
              systemProgram: SystemProgram.programId,
              signer: provider.wallet.publicKey
            },
            signers: [stringAccount],
          });

      const ownership = await program.account.ownership.fetch(stringAccount.publicKey);
      assert.equal(ownership.fingerprint.toString(), md5StringData.toString());
      assert.equal(ownership.owner.toBase58(), provider.wallet.publicKey.toBase58());
    });

  })
  describe("Transfer", () => {
    const newOwnerWallet = anchor.web3.Keypair.generate()
    it("Should success", async () => {
      await program.rpc.transfer(
          newOwnerWallet.publicKey,
          {
            accounts: {
              ownership: stringAccount.publicKey,
              systemProgram: SystemProgram.programId,
              signer: provider.wallet.publicKey
            },
            signers: [],
          });

      const ownership = await program.account.ownership.fetch(stringAccount.publicKey);
      assert.equal(ownership.fingerprint.toString(), md5StringData.toString());
      assert.equal(ownership.owner.toBase58(), newOwnerWallet.publicKey.toBase58());
    });

  })
});
