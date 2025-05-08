import {
    mplCore,
    update,
    fetchAsset,
    fetchCollection,
  } from "@metaplex-foundation/mpl-core";
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
  // See https://github.com/solana-developers/helpers?tab=readme-ov-file#get-a-keypair-from-a-keypair-file
  // assumes that the keypair is already generated using `solana-keygen new`
  const user = await getKeypairFromFile();
  console.log("Loaded user:", user.publicKey.toBase58());
  
  await airdropIfRequired(
    connection,
    user.publicKey,
    1 * LAMPORTS_PER_SOL,
    0.1 * LAMPORTS_PER_SOL,
  );
  
  // create a new connection to Solana's devnet cluster
  const umi = createUmi(connection).use(mplCore()).use(irysUploader());
  
  // convert to umi compatible keypair
  const umiKeypair = umi.eddsa.createKeypairFromSecretKey(user.secretKey);
  
  // assigns a signer to our umi instance, and loads the MPL metadata program and Irys uploader plugins.
  umi.use(keypairIdentity(umiKeypair));

  const assetImagePath = "asset.png";

const buffer = await fs.readFile(assetImagePath);
let file = createGenericFile(buffer, assetImagePath, {
  contentType: "image/png",
});

// upload new image and get image uri
const [image] = await umi.uploader.upload([file]);
console.log("image uri:", image);

const metadata = {
  name: "My Updated Asset",
  description: "My Updated Asset Description",
  image,
  external_url: "https://example.com",
  attributes: [
    {
      trait_type: "trait1",
      value: "value1",
    },
    {
      trait_type: "trait2",
      value: "value2",
    },
  ],
  properties: {
    files: [
      {
        uri: image,
        type: "image/jpeg",
      },
    ],
    category: "image",
  },
};

// upload offchain json using irys and get metadata uri
const uri = await umi.uploader.uploadJson(metadata);
console.log("Asset offchain metadata URI:", uri);

// Fetch the accounts using the address
const asset = await fetchAsset(umi, UMIPublicKey("YOUR_ASSET_ADDRESS_HERE"));
const collection = await fetchCollection(
  umi,
  UMIPublicKey("YOUR_COLLECTION_ADDRESS_HERE"),
);

await update(umi, {
  asset,
  collection,
  name: "My Updated Asset",
  uri,
}).sendAndConfirm(umi);

let explorerLink = getExplorerLink("address", asset.publicKey, "devnet");
console.log(`Asset updated with new metadata URI: ${explorerLink}`);

console.log("✅ Finished successfully!");