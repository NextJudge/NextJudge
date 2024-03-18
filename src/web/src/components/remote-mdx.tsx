import { MDXRemote } from "next-mdx-remote/rsc";

export default async function RemoteMdxPage() {
  const res = await fetch("../md/twosum.md");
  const markdown = await res.text();
  return <MDXRemote source={markdown} />;
}
