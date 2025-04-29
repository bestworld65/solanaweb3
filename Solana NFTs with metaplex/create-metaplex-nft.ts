import {
    createNft,
    findMetadataPda,
    mplTokenMetadata,
    verifyCollectionV1,
  } from "@metaplex-foundation/mpl-token-metadata";
  import {
    createGenericFile,
    generateSigner,
    keypairIdentity,
    percentAmount,
    publicKey as UMIPublicKey,
  } from "@metaplex-foundation/umi";
  import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
  import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
  import {
    airdropIfRequired,
    getExplorerLink,
    getKeypairFromFile,
  } from "@solana-developers/helpers";
  import { clusterApiUrl, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
  import { promises as fs } from "fs";
  import * as path from "path";
  // create a new connection to Solana's devnet cluster
  const connection = new Connection(clusterApiUrl("devnet"));
  
  // load keypair from local file system
  // assumes that the keypair is already generated using `solana-keygen new`
  const user = await getKeypairFromFile();
  console.log("Loaded user:", user.publicKey.toBase58());
  
  await airdropIfRequired(
    connection,
    user.publicKey,
    1 * LAMPORTS_PER_SOL,
    0.1 * LAMPORTS_PER_SOL,
  );
  
  const umi = createUmi(connection);
  
  // convert to umi compatible keypair
  const umiKeypair = umi.eddsa.createKeypairFromSecretKey(user.secretKey);
  
  // load our plugins and signer
  umi
    .use(keypairIdentity(umiKeypair))
    .use(mplTokenMetadata())
    .use(irysUploader());