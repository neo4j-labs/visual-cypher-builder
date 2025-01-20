import { Button, Dialog, TextInput, Banner, Dropzone, Select } from '@neo4j-ndl/react';
import { useEffect, useState } from 'react';
import { setDriver } from './Driver';

interface Message {
    type: 'success' | 'info' | 'warning' | 'danger' | 'neutral';
    content: string;
}

interface ConnectionModalProps {
    open: boolean;
    connection: any;
    setOpen: (arg: boolean) => void;
    setConnection: (connection: any) => void;
    setConnected: (status: boolean) => void;
    message?: Message;
}

    /**
     * The ConnectionModal component manages the connection to a Neo4j database.
     * 
     * @param {boolean} open - Determines if the modal is open or closed.
     * @param {Object} connection - Object containing the connection details.
     * @param {Function} setOpen - Callback to set the open state of the modal.
     * @param {Function} setConnected - Callback to set the connected state.
     * @param {Function} setConnection - Callback to update the connection state.
     * @param {Message} message - Message to show in the modal, or null to show no message.
     * @returns {JSX.Element} The rendered ConnectionModal component.
     */
export default function ConnectionModal({
    open,
    connection,
    setOpen,
    setConnected,
    setConnection,
    message,
}: ConnectionModalProps) {
    const protocols = ['neo4j', 'neo4j+s', 'neo4j+ssc'];
    const [protocol, setProtocol] = useState<string>(connection?.protocol ? connection.protocol : 'neo4j+s');
    const [URI, setURI] = useState<string>(connection?.uri ? connection.uri : 'localhost');
    const [port, setPort] = useState<string>(connection?.port ? connection.port : '7687');
    const [database, setDatabase] = useState<string>(connection?.database ? connection.database : 'neo4j');
    const [username, setUsername] = useState<string>(connection?.user ? connection.user : 'neo4j');
    const [password, setPassword] = useState<string>(connection?.password ? connection.password : '');
    const [connectionMessage, setMessage] = useState<Message | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(false);


    useEffect(() => {
        // @ts-ignore
        setMessage('');
    }, [open])

    const parseAndSetURI = (uri: string) => {
        const uriParts = uri.split('://');
        const uriHost = uriParts.pop() || URI;
        setURI(uriHost);
        const uriProtocol = uriParts.pop() || protocol;
        setProtocol(uriProtocol);
        const uriPort = uriParts.pop() || port;
        setPort(uriPort);
    };

    const handleHostPasteChange: React.ClipboardEventHandler<HTMLInputElement> = (event) => {
        event.clipboardData.items[0]?.getAsString((value) => {
            parseAndSetURI(value);
        });
    };


    function submitConnection() {
        setIsLoading(true);
        const connectionURI = `${protocol}://${URI}${URI.split(':')[1] ? '' : `:${port}`}`;
        setDriver(connectionURI, username, password).then((isSuccessful) => {
            // setConnectionStatus(isSuccessful);
            if (isSuccessful) {
                setConnected(true);
                setConnection({
                    protocol: protocol,
                    uri: URI,
                    port: port,
                    database: database,
                    user: username,
                    password: password,
                });
                setOpen(false);
                setIsLoading(false);
            } else {
                setMessage({
                    type: 'danger',
                    content: 'Unable to connect to your database. Please check your credentials.',
                });
                setIsLoading(false);
            }

        });
    }

    const onDropHandler = async (files: Partial<globalThis.File>[]) => {
        setIsLoading(true);
        if (files.length) {
          const [file] = files;
          try {
            if (file.text && file.size !== 0) {
              const text = await file.text();
              const lines = text.split(/\r?\n/);
              const configObject = lines.reduce((acc: Record<string, string>, line: string) => {
                if (line.startsWith('#') || line.trim() === '') {
                  return acc;
                }
    
                const [key, value] = line.split('=');
                if (['NEO4J_URI', 'NEO4J_USERNAME', 'NEO4J_PASSWORD', 'NEO4J_DATABASE', 'NEO4J_PORT'].includes(key)) {
                  acc[key] = value;
                }
                return acc;
              }, {});
              parseAndSetURI(configObject.NEO4J_URI);
              setUsername(configObject.NEO4J_USERNAME ?? 'neo4j');
              setPassword(configObject.NEO4J_PASSWORD ?? '');
              setDatabase(configObject.NEO4J_DATABASE ?? 'neo4j');
              setPort(configObject.NEO4J_PORT ?? "7687");
            } else {
              setMessage({ type: 'danger', content: 'Please drop a valid file' });
            }
          } catch (err: any) {
            console.log({ err });
            setMessage({ type: 'danger', content: err.message });
          }
        }
        setIsLoading(false);
    };

    return (
        <>
            <Dialog size='small' isOpen={open} aria-labelledby='form-dialog-title'

                onClose={() => {
                    setMessage(null);
                    setOpen(false)
                }}>
                <Dialog.Header >Connect to Neo4j</Dialog.Header>
                <Dialog.Content className='n-flex n-flex-col n-gap-token-4' style={{}}>
                    {message && <Banner type={message.type}>{message.content}</Banner>}
                    {connectionMessage && <Banner type={connectionMessage.type}>{connectionMessage.content}</Banner>}

                    <div className='n-flex max-h-60'>
                        <Dropzone
                            isTesting={false}
                            customTitle={<>{"Drop your neo4j credentials file here"}</>}
                            className='n-p-6 end-0 top-0 w-full h-full'
                            acceptedFileExtensions={['.txt', '.env']}
                            dropZoneOptions={{
                                onDrop: (f: Partial<globalThis.File>[]) => {
                                onDropHandler(f);
                                },
                                maxSize: 500,
                                onDropRejected: (e) => {
                                if (e.length) {
                                    setMessage({ type: 'danger', content: 'Failed To Upload, File is larger than 500 bytes' });
                                }
                                },
                            }}
                        />
                    </div>

                    <div className='n-flex n-flex-row n-flex-wrap'>
                        <Select
                            // id='protocol'
                            label='Protocol'
                            type='select'
                            size='medium'
                            // disabled={false}
                            style={{ height: '30px' }}
                            selectProps={{
                                onChange: (newValue) => newValue && setProtocol(newValue.value),
                                styles: { control: (base) => ({ ...base, height: '25px', padding: 0, width: '150px', marginTop: '-2px', marginBottom: '-4px' }) },
                                options: protocols.map((option) => ({ label: option, value: option })),
                                value: { label: protocol, value: protocol },
                            }}
                            // className='w-1/4 inline-block'
                            // @ts-ignore
                            fluid
                        /> &nbsp; &nbsp;

                        <TextInput
                            // id='url'
                            value={URI}
                            // disabled={false}
                            label='URI'
                            size='medium'
                            isFluid
                            style={{ width: '275px' }}
                            placeholder='localhost'
                            // autoFocus
                            // fluid
                            onChange={(e) => setURI(e.target.value)}
                            // @ts-ignore
                            onPaste={(e) => handleHostPasteChange(e)}
                        />

                        &nbsp; &nbsp;
                        <TextInput
                            // id='port'
                            value={port}
                            // disabled={false}
                            label='Port'
                            placeholder='7687'
                            // autoFocus
                            isFluid
                            style={{ width: '100px' }}
                            // @ts-ignore
                            onChange={(e) => setPort(e.target.value)}
                            // @ts-ignore
                            onPaste={(e) => handleHostPasteChange(e)}
                        />

                    </div>
                    <TextInput
                        // id='database'
                        value={database}
                        // disabled={false}
                        label='Database (optional)'
                        placeholder='neo4j'
                        isFluid
                        style={{ width: '100% !important' }}
                        // @ts-ignore
                        selectProps={{
                            styles: { control: (base) => ({ ...base, width: '500px' }) }
                        }}
                        onChange={(e) => setDatabase(e.target.value)}

                    />
                    <div className='n-flex n-flex-row n-flex-wrap mb-2'>

                        <TextInput
                            // id='username'
                            value={username}
                            // disabled={false}
                            style={{ width: '277px' }}
                            label='Username'
                            placeholder='neo4j'
                            isFluid
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        &nbsp; &nbsp;
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            submitConnection()
                        }}>
                            <TextInput
                                // id='password'
                                value={password}
                                // disabled={false}
                                style={{ width: '280px' }}
                                htmlAttributes={{
                                    type: 'password',
                                }}
                                label='Password'
                                placeholder=''
                                // @ts-ignore
                                type='password'
                                isFluid

                                onChange={(e) => setPassword(e.target.value)}

                            />
                        </form>
                    </div>

                    &nbsp;
                    <Button isDisabled={isLoading} onClick={() => submitConnection()}>Connect</Button>
                </Dialog.Content>
            </Dialog>
        </>
    );
}