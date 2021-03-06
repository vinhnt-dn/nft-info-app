import { Transaction, Keypair } from '@solana/web3.js'
import { sign, hash } from 'tweetnacl'
import { account, Provider, Signature } from '@senswap/sen-js'

import BaseWallet from './baseWallet'
import session from 'shared/session'
import storage from 'shared/storage'

type ExpanedProvider = Provider & { keypair: Keypair }

class SecretKeyWallet extends BaseWallet {
  constructor(secretKey: string, password?: string) {
    super('SecretKey')

    SecretKeyWallet.setSecretKey(secretKey, password)
  }

  static xor = (
    a: Buffer | Uint8Array,
    b: Buffer | Uint8Array,
  ): Buffer | Uint8Array => {
    if (a.length !== b.length)
      throw new Error('Cannot XOR two different-length buffers')
    const r = Buffer.alloc(a.length)
    for (let i = 0; i < r.length; i++) r[i] = a[i] ^ b[i]
    return r
  }

  static getPassword = (): string => {
    let pwd = session.get('Password')
    if (!pwd) pwd = window.prompt('Input the password:')
    if (!pwd) throw new Error('User rejects to sign the transaction')
    session.set('Password', pwd)
    return pwd
  }

  static setSecretKey = (secretKeyString: string, pwd?: string): void => {
    const { secretKey } = account.fromSecretKey(secretKeyString) || {}
    if (!secretKey) throw new Error('Invalid secret key')
    pwd = pwd || SecretKeyWallet.getPassword()
    const seed = hash(Buffer.from(pwd))
    const confusedSecretKey = SecretKeyWallet.xor(seed, secretKey)
    storage.set('SecretKey', confusedSecretKey.toString('hex'))
  }

  static getSecretKey = (pwd?: string): string => {
    pwd = pwd || SecretKeyWallet.getPassword()
    const seed = hash(Buffer.from(pwd))
    const confusedSecretKey = storage.get('SecretKey')
    if (!confusedSecretKey) throw new Error('Invalid secret key')
    const secretKey = SecretKeyWallet.xor(
      seed,
      Buffer.from(confusedSecretKey, 'hex'),
    )
    return secretKey.toString('hex')
  }

  getProvider = async (): Promise<ExpanedProvider> => {
    const secretKey = SecretKeyWallet.getSecretKey()
    const keypair = account.fromSecretKey(secretKey)
    if (!keypair) throw new Error('Cannot get the keystore-based provider')
    const provider = {
      keypair,
      disconnect: () => session.clear('SecretKey'),
    }
    return provider
  }

  getAddress = async () => {
    const { keypair } = await this.getProvider()
    return keypair.publicKey.toBase58()
  }

  rawSignTransaction = async (transaction: Transaction) => {
    const confirmed = window.confirm('Please confirm to sign the transaction!')
    if (!confirmed) throw new Error('User rejects to sign the transaction')
    const { keypair } = await this.getProvider()
    const signData = transaction.serializeMessage()
    const publicKey = keypair.publicKey
    const signature = sign.detached(signData, keypair.secretKey)
    return { publicKey, signature } as Signature
  }

  signMessage = async (message: string) => {
    if (!message) throw new Error('Message must be a non-empty string')
    const confirmed = window.confirm(
      `Please confirm to sign the message! Message: ${message}`,
    )
    if (!confirmed) throw new Error('User rejects to sign the message')
    const { keypair } = await this.getProvider()
    const secretKey = Buffer.from(keypair.secretKey).toString('hex')
    const data = account.signMessage(message, secretKey)
    return { ...data }
  }

  verifySignature = async (
    signature: string,
    message: string,
    address?: string,
  ) => {
    address = address || (await this.getAddress())
    const valid = account.verifySignature(address, signature, message)
    return valid as boolean
  }
}

export default SecretKeyWallet
