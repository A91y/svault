import {
  ActionPostResponse,
  createPostResponse,
  ActionGetResponse,
  ActionPostRequest,
  createActionHeaders,
  ActionError,
} from "@solana/actions";
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { Program, Idl, AnchorProvider, setProvider } from "@coral-xyz/anchor";
import { Vault } from "../../../../idl/vault";
import idl from "../../../../idl/vault.json";
import * as anchor from "@coral-xyz/anchor";

// create the standard headers for this route (including CORS)
const headers = createActionHeaders({
  chainId: "devnet",
});
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const program = new Program<Vault>(
  idl as Vault,
  new AnchorProvider(connection, {} as any, {})
);

export const GET = async (req: Request) => {
  try {
    const requestUrl = new URL(req.url);
    const baseHref = new URL(
      `/api/actions/deposit`,
      requestUrl.origin
    ).toString();

    const payload: ActionGetResponse = {
      type: "action",
      title: "Vault - Deposit SOL",
      icon: new URL("/logo.png", requestUrl.origin).toString(),
      description: `A Vault to store Native SOLs: 
      1. Create a Vault 
      2. Deposit into the Vault (here)
      3. Withdraw from the Vault
      4. Close the Vault 
      `,
      label: "Vault - Deposit SOL",
      links: {
        actions: [
          {
            label: "Deposit SOL",
            href: `${baseHref}?amount={amount}`,
            parameters: [
              {
                name: "amount",
                type: "number",
                required: true,
                label: "Amount to Deposit",
              },
            ],
          },
        ],
      },
    };

    return Response.json(payload, {
      headers,
    });
  } catch (err) {
    console.log(err);
    let actionError: ActionError = { message: "An unknown error occurred" };
    if (typeof err == "string") actionError.message = err;
    return Response.json(actionError, {
      status: 400,
      headers,
    });
  }
};

// DO NOT FORGET TO INCLUDE THE `OPTIONS` HTTP METHOD
// THIS WILL ENSURE CORS WORKS FOR BLINKS
export const OPTIONS = async () => Response.json(null, { headers });

export const POST = async (req: Request) => {
  try {
    const requestUrl = new URL(req.url);
    const body: ActionPostRequest = await req.json();

    const { amount } = validatedQueryParams(requestUrl);

    // validate the client provided input
    let account: PublicKey;
    try {
      account = new PublicKey(body.account);
    } catch (err) {
      throw 'Invalid "account" provided';
    }
    const [statePda, stateBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("state"), account.toBuffer()],
      program.programId
    );
    const vaultState = statePda;

    const [vaultPda, vaultBumpSeed] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), vaultState.toBuffer()],
        program.programId
      );
    const vault = vaultPda;

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();

    const transaction = new Transaction({
      feePayer: account,
      blockhash,
      lastValidBlockHeight,
    }).add(
      program.instruction.deposit(
        new anchor.BN(amount * anchor.web3.LAMPORTS_PER_SOL),
        {
          accounts: {
            user: account,
            state: vaultState,
            vault: vault,
            systemProgram: SystemProgram.programId,
          },
        }
      )
    );

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        transaction,
        message: `Deposited ${amount} SOL into the Vault`,
      },
    });
    return Response.json(payload, {
      headers,
    });
  } catch (err) {
    console.log(err);
    let actionError: ActionError = { message: "An unknown error occurred" };
    if (typeof err == "string") actionError.message = err;
    return Response.json(actionError, {
      status: 400,
      headers,
    });
  }
};

function validatedQueryParams(requestUrl: URL) {
  let amount: number;
  let tokenMint: PublicKey;

  try {
    if (requestUrl.searchParams.get("amount")) {
      amount = parseFloat(requestUrl.searchParams.get("amount")!);
    } else {
      throw "Invalid input query parameter: amount";
    }

    if (amount <= 0) throw "amount is too small";
  } catch (err) {
    throw "Invalid input query parameter: amount";
  }

  return {
    amount,
  };
}
