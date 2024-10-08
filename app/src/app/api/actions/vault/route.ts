import {
  ActionGetResponse,
  createActionHeaders,
  ActionError,
} from "@solana/actions";
import { clusterApiUrl, Connection } from "@solana/web3.js";
import { Program, Idl, AnchorProvider, setProvider } from "@coral-xyz/anchor";
import { Vault } from "../../../../idl/vault";
import idl from "../../../../idl/vault.json";

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
    const baseHref = new URL(`/api/actions`, requestUrl.origin).toString();

    // Create the payload with buttons for each action
    const payload: ActionGetResponse = {
      type: "action",
      title: "Svault - The SOL Vault",
      icon: new URL("/logo.png", requestUrl.origin).toString(),
      description: `A Vault to store Native SOLs: 
      1. Create a Vault
      2. Deposit into the Vault 
      3. Withdraw from the Vault
      4. Close the Vault 
      `,
      label: "Vault Actions",
      links: {
        actions: [
          {
            label: "Initialize Vault",
            href: `${baseHref}/initialize`,
          },
          {
            label: "Deposit",
            href: `${baseHref}/deposit?amount={amount}`,
            parameters: [
              {
                name: "amount",
                type: "number",
                label: "Amount to Deposit",
              },
            ],
          },
          {
            label: "Withdraw",
            href: `${baseHref}/withdraw?amount={amount}`,
            parameters: [
              {
                name: "amount",
                type: "number",
                label: "Amount to Withdraw",
              },
            ],
          },
          {
            label: "Close Vault",
            href: `${baseHref}/close`,
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
