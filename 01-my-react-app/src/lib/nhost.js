import { createClient } from "@nhost/nhost-js";

// Replace <subdomain> and <region> with your project's values
export const nhost = createClient({
  subdomain: "ppgejgwvjxtzjwuixeic",//"<subdomain>",
  region: "ap-southeast-1",//"<region>",
})