import Arweave from 'arweave';
import Account from 'arweave-account';
export const arweave = Arweave.init({});
export const account = new Account({
  cacheIsActivated: true,
  cacheSize: 100,
  cacheTime: 3600000  // 3600000ms => 1 hour cache duration
});
export const maxMessageLength = 1024;

export const isWellFormattedAddress = (input) => {
  const re = /^[a-zA-Z0-9_]{43}$/;
  return re.test(input);
}
 
export const createPostInfo = (node) => {
  const ownerAddress = node.owner.address;
  const height = node.block ? node.block.height : -1;
  const timestamp = node?.block?.timestamp ? parseInt(node.block.timestamp, 10) * 1000 : -1;
  const postInfo = {
    txid: node.id,
    owner: ownerAddress,
    height: height,
    account: account.get(ownerAddress),
    length: node.data.size,
    timestamp: timestamp,
    request:null,
  }
  if (postInfo.length >= 0) {
    const res  = arweave.api.get(`/${node.id}`, { timeout: 10000 }).then(
      v =>{
        console.log(v)
        postInfo.request = v
      }
    ).catch(() => { postInfo.error = 'timeout loading data' });
    // console.log(res)
    
  } else {
    postInfo.error = `message is too large (exceeds ${maxMessageLength/1024}kb)`;
  }
  return postInfo;
}

export const buildQuery = () => {
  const queryObject = { query: `{
    transactions(first: 10,
      tags:[
        {
          name:"Content-type",
          values:["image/png"]
        }
      ]
      
    ) {
      edges {
        node {
          id
          owner {
            address
          }
          data {
            size
            type
          }
          block {
            height
            timestamp
          }
          tags {
            name,
            value
          }
        }
      }
    }
  }`}
  return queryObject;
 }

// in miliseconds
var units = {
  year  : 24 * 60 * 60 * 1000 * 365,
  month : 24 * 60 * 60 * 1000 * 365/12,
  day   : 24 * 60 * 60 * 1000,
  hour  : 60 * 60 * 1000,
  minute: 60 * 1000,
  second: 1000
}

var rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

export const getRelativeTime = (ts1, ts2) => {
  var elapsed = ts1 - ts2
  // "Math.abs" accounts for both "past" & "future" scenarios
  for (var u in units) 
    if (Math.abs(elapsed) > units[u] || u === 'second') 
      return rtf.format(Math.round(elapsed/units[u]), u)
}

export const getPostTime = (timestamp) => {
  if (timestamp < 0) {
    return "pending...";
  }
  return getRelativeTime(timestamp, Date.now());
}

export const abbreviateAddress = (address) => {
  if (!address)
    return address;
  const firstFive = address.substring(0,5);
  const lastFour = address.substring(address.length-4);
  return `${firstFive}..${lastFour }`;
}

export const getTopicString = (input) => {
  let dashedTopic = (input || '')
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
  return dashedTopic;
}

export const delay = (t) => {
  return new Promise(function(resolve) {
    setTimeout(function() {
      resolve();
    }, t);
  });
}

export const delayResults = (milliseconds, results) => {
  return delay(milliseconds).then(function() {
    return results;
  });
}

export function Base64Image({ imageData, alt }) {
  // Decode base64 data
  const decodedData = atob(imageData);

  // Create a Blob from the decoded data
  const arrayBuffer = new ArrayBuffer(decodedData.length);
  const uint8Array = new Uint8Array(arrayBuffer);

  for (let i = 0; i < decodedData.length; i++) {
    uint8Array[i] = decodedData.charCodeAt(i);
  }

  const blob = new Blob([arrayBuffer]);

  // Create a data URL from the Blob
  const imageUrl = URL.createObjectURL(blob);

  return <img src={imageUrl} alt={alt} />;
}