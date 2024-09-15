import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Vault } from "../target/types/vault";
import { SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

describe("vault", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Vault as Program<Vault>;

  let user: anchor.web3.Keypair;
  let vaultState: anchor.web3.PublicKey;
  let vault: anchor.web3.PublicKey;
  let vaultBump: number;

  before(async () => {
    user = anchor.web3.Keypair.generate();

    const [statePda, stateBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("state"), user.publicKey.toBuffer()],
      program.programId
    );
    vaultState = statePda;

    const [vaultPda, vaultBumpSeed] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), vaultState.toBuffer()],
        program.programId
      );
    vault = vaultPda;
    vaultBump = vaultBumpSeed;

    // Airdrop SOL to user for testing
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        user.publicKey,
        1 * anchor.web3.LAMPORTS_PER_SOL
      ),
      "confirmed"
    );
  });

  it("Initializes the vault", async () => {
    await program.methods
      .initialize()
      .accountsPartial({
        user: user.publicKey,
        state: vaultState,
        vault: vault,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const stateAccount = await program.account.vaultState.fetch(vaultState);
    assert.equal(stateAccount.vaultBump, vaultBump);
  });

  it("Deposits into the vault", async () => {
    const depositAmount = 0.5 * anchor.web3.LAMPORTS_PER_SOL;
    const initialUserBalance = await provider.connection.getBalance(
      user.publicKey
    );
    await program.methods
      .deposit(new anchor.BN(depositAmount))
      .accountsPartial({
        user: user.publicKey,
        state: vaultState,
        vault: vault,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();
    const finalUserBalance = await provider.connection.getBalance(
      user.publicKey
    );
    const vaultAccount = await provider.connection.getAccountInfo(vault);
    assert.equal(vaultAccount.lamports, depositAmount);
    assert.equal(finalUserBalance, initialUserBalance - depositAmount);
  });

  it("Withdraws from the vault", async () => {
    const withdrawAmount = 0.2 * anchor.web3.LAMPORTS_PER_SOL;
    const initialUserBalance = await provider.connection.getBalance(
      user.publicKey
    );
    await program.methods
      .withdraw(new anchor.BN(withdrawAmount))
      .accountsPartial({
        user: user.publicKey,
        state: vaultState,
        vault: vault,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();
    const finalUserBalance = await provider.connection.getBalance(
      user.publicKey
    );
    const vaultAccount = await provider.connection.getAccountInfo(vault);
    assert.equal(vaultAccount.lamports, 0.3 * anchor.web3.LAMPORTS_PER_SOL);
    assert.equal(finalUserBalance, initialUserBalance + withdrawAmount);
  });

  it("Closes the vault", async () => {
    await program.methods
      .close()
      .accountsPartial({
        user: user.publicKey,
        state: vaultState,
        vault: vault,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const vaultAccount = await provider.connection.getAccountInfo(vault);
    assert.isNull(vaultAccount); // vault should be closed, meaning account is gone

    const stateAccount = await program.account.vaultState.fetchNullable(
      vaultState
    );
    assert.isNull(stateAccount); // state should be closed, meaning account is gone
  });
});
