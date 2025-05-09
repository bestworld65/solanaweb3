import {
    createNft,
    fetchMetadataFromSeeds,
    updateV1,
    findMetadataPda,
    mplTokenMetadata,
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

    // Load the NFT using the mint address
const mint = UMIPublicKey("YOUR_NFT_ADDRESS_HERE");
const asset = await fetchDigitalAsset(umi, mint);

// example data for updating an existing NFT
const updatedNftData = {
  name: "Updated Asset",
  symbol: "UPDATED",
  description: "Updated Description",
  sellerFeeBasisPoints: 0,
  imageFile: "nft.png",
};

const NFTImagePath = path.resolve(__dirname, "nft.png");

const buffer = await fs.readFile(NFTImagePath);
let file = createGenericFile(buffer, NFTImagePath, {
  contentType: "image/png",
});

// upload new image and get image uri
const [image] = await umi.uploader.upload([file]);
console.log("image uri:", image);

// upload updated offchain json using irys and get metadata uri
const uri = await umi.uploader.uploadJson({
  name: "Updated ",
  symbol: "UPDATED",
  description: "Updated Description",
  image,
});
console.log("NFT offchain metadata URI:", uri);

// Load the NFT using the mint address
const mint = UMIPublicKey("Zxd9TmtBHQNti6tJxtx1AKYJFykNUwJL4rth441CjRd");
const nft = await fetchMetadataFromSeeds(umi, { mint });

await updateV1(umi, {
  mint,
  authority: umi.identity,
  data: {
    ...nft,
    sellerFeeBasisPoints: 0,
    name: "Updated Asset",
  },
  primarySaleHappened: true,
  isMutable: true,
}).sendAndConfirm(umi);

let explorerLink = getExplorerLink("address", mint, "devnet");
console.log(`NFT updated with new metadata URI: ${explorerLink}`);

console.log("✅ Finished successfully!");