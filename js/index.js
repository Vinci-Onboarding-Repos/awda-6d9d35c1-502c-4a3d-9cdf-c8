const VINCI_ENV = sessionStorage.getItem('vinciEnv');
const BASE_URL = VINCI_ENV === 'dev' ? 'http://localhost:5001/vinci-dev-6e577/us-central1/api/public' :
    'https://us-central1-vinci-dev-6e577.cloudfunctions.net/api/public';
const PROJECT_ID = 'teste-e40fae4e-e910-4905-b21d-7'
const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
const Fortmatic = window.Fortmatic;
const evmChains = window.evmChains;
const ignore = ["WEB3_CONNECT_MODAL_ID", "template", "inputNext", "eth", "sol"];

const fetchUsers = () => {
    axios.get(BASE_URL, {
        params: {
            url: window.location.href,
            API_KEY: 'VINCI_DEV_6E577'
        }, headers: { "Access-Control-Allow-Origin": "*" }
    }).then(response => {
        const users = response.data.data;
    }).catch(error => console.error(error));
};

const logPageView = () => {
    if (PROJECT_ID === "awda-6d9d35c1-502c-4a3d-9cdf-c8") return;
    axios.post(BASE_URL + '/onboardingview', {
        projectId: PROJECT_ID,
        requestURL: window.location.href,
        API_KEY: 'VINCI_DEV_6E577'
    });
}

const storeUserWallet = (selectedWallet) => {

    if (window.localStorage.getItem('user') !== null) {
        let userData = JSON.parse(window.localStorage.getItem('user'));
        console.log(userData)
        userData.wallet = selectedWallet;
        window.localStorage.setItem('user', JSON.stringify(userData));
        userData = JSON.parse(window.localStorage.getItem('user'));
        axios.post(BASE_URL + '/updateuseronboarding', {
            projectId: PROJECT_ID,
            requestURL: window.location.href,
            userData: userData,
            API_KEY: 'VINCI_DEV_6E577'
        });

    } else {
        const userData = { wallet: selectedWallet, id: 'onboarding-user-' + crypto.randomUUID() };
        console.log(userData)
        window.localStorage.setItem('user', userData);
        axios.post(BASE_URL + '/adduseronboarding', {
            projectId: PROJECT_ID,
            requestURL: window.location.href,
            userData: userData,
            API_KEY: 'VINCI_DEV_6E577'
        });
    }
}

async function checkUserInput() {
    var allElements = document.querySelectorAll('*[id]');
    var allIds = {};
    for (var i = 0, n = allElements.length; i < n; ++i) {
        var el = allElements[i];
        if (!ignore.includes(el.id)) {
            if (el.id) {
                allIds[el.id.toString()] = el.value;
            }
        }
    }

    if (window.localStorage.getItem('user') !== null) {
        let userData = JSON.parse(window.localStorage.getItem('user'));
        let merged = { ...userData, ...allIds };
        window.localStorage.setItem('user', JSON.stringify(merged));
        axios.post(BASE_URL + '/updateuseronboarding', {
            projectId: PROJECT_ID,
            requestURL: window.location.href,
            userData: merged,
            API_KEY: 'VINCI_DEV_6E577'
        });

    } else {
        allIds.id = 'onboarding-user-' + crypto.randomUUID();
        window.localStorage.setItem('user', JSON.stringify(allIds));
        let userData = JSON.parse(window.localStorage.getItem('user'));
        axios.post(BASE_URL + '/adduseronboarding', {
            projectId: PROJECT_ID,
            requestURL: window.location.href,
            userData: userData,
            API_KEY: 'VINCI_DEV_6E577'
        });
    }
}

function init() {
    const providerOptions = {
        walletconnect: {
            package: WalletConnectProvider,
            options: {
                infuraId: "7550f76d68824553876499772c39974a",
            }
        },
    };
    web3Modal = new Web3Modal({
        cacheProvider: true,
        providerOptions,
        disableInjectedProvider: false
    });
    console.log("Web3Modal instance is", web3Modal);
}

function getProvider() {
    if ("phantom" in window) {
        const provider = window.phantom?.solana;

        if (provider?.isPhantom) {
            return provider;
        }
    }
    window.open("https://phantom.app/", "_blank");
}

async function refreshAccountData(event) {
    await fetchAccountData(provider, event);
}

async function onConnect(event) {
    try {
        provider = await web3Modal.connect();
    } catch (e) {
        console.log("Could not get a wallet connection", e);
        return;
    }
    provider.on("accountsChanged", (accounts) => {
        fetchAccountData(event);
    });
    provider.on("chainChanged", (chainId) => {
        fetchAccountData(event);
    });
    provider.on("networkChanged", (networkId) => {
        fetchAccountData(event);
    });

    await refreshAccountData(event);

}

async function onSolConnect(event) {
    event.preventDefault();
    const provider = getProvider();
    try {
        provider.connect().then((resp) => {
            console.log(resp.publicKey.toString());
            const connectButton = document.getElementById("sol");
            connectButton.innerHTML = window.solana.publicKey;
            status.innerHTML = provider.isConnected.toString();
            const data = document.querySelector("#sol");
            const res = check_user_NFT(resp.publicKey.toString(), data.dataset.address)
            if (res) {
                storeUserWallet(resp.publicKey.toString());
                location.href = data.dataset.href;
            }
        });
    } catch (err) {
        console.log(err);
    }
}

async function fetchAccountData(event) {
    const web3 = new Web3(provider);
    const accounts = await web3.eth.getAccounts();
    selectedAccount = accounts[0];
    const data = document.querySelector("#eth");
    const res = check_user_NFT(selectedAccount, data.dataset.address)
    if (res) {
        storeUserWallet(selectedAccount);
        location.href = data.dataset.href;
    }
}

async function check_user_NFT(user_address, token_address, provider_uri) {
    const opensea_uri = 'https://api.opensea.io/api/v1/assets?owner=' + user_address;
    const response = await axios.get(opensea_uri);
    const data = response.data.assets;
    for (var i = 0; i < data.length; i++) {
        if (data[i].asset_contract.address === token_address) {
            return true;
        }
    }
    document.getElementById("error-text").innerHTML = "You don't have the necessary Token";
    return false;
}

logPageView();
init();


window.addEventListener('load', async () => {
    init();
});
