import { useEffect, useRef, useState } from "react";
import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import SideContainer from "../builder/container/SideContainer";
import QueryContainer from "../builder/container/QueryContainer";
import FooterContainer from "../builder/container/FooterContainer";
import SortableBlock from "../builder/sortable/SortableBlock";
import { handleDragEnd, handleDragOver, handleDragStart, handleSortableItemClick, handleSortableItemDelete } from "./BuilderEventHandler";
import { resetBuilderQuery, initializeBuilder, SIDEBAR_CONTAINER_COUNT, sidebarCategories, updateBuilderNodesRelationships, FOOTER_CONTAINER_COUNT } from "./logic/BuilderLogic";
import CodeEditor, { generateCypher } from "./editor/CodeEditor";
import { Accordion, DropdownButton, IconButton, Menu, Tag, toast, Toaster, Tooltip } from "@neo4j-ndl/react";
import { ClipboardDocumentIconOutline, PlayCircleIconOutline, QueryBrowserIcon, TrashIconOutline, VariableIconSolid, WrenchScrewdriverIconOutline, WrenchScrewdriverIconSolid } from "@neo4j-ndl/react/icons";
import { extractVariables, updateBuilderVariables } from "./logic/VariablesLogic";
import TemplatesModal from "./templates/TemplatesModal";
import { updateCypherWizard } from "./logic/WizardLogic";
import QueryRunner from "./queryRunner/QueryRunner";

const wrapperStyle = {
    display: "flex",
};


/**
 * The main Cypher builder component, containing three columns:
 * - a sidebar with a list of SideContainers (the gallery of blocks)
 * - The builder container, where the user can drag and drop blocks, and has the Wizard under it.
 * - The code editor, where the user can view the Cypher query.
 * 
 * @param {Boolean} props.connected - Whether the user is connected to the database
 * @param {Object} props.connection - The connection object
 * @param {Object} props.schema - The schema of the database
 * @param {Object[]} props.queryTemplates - The query templates
 * @returns {React.ReactElement} - The Cypher builder component
 */
export default function Builder(props: {
    connected: boolean,
    connection: any,
    schema: any,
    queryTemplates: any
}) {
    const { connected, connection, schema, queryTemplates } = props;

    const [elements, setElements] = useState({});
    const [items, setItems] = useState([]);
    const [activeId, setActiveId] = useState(undefined);
    const prevVariables = useRef([]);
    const variables = extractVariables(items, elements);
    const prevLastRow = useRef([]);
    const lastRow = items[items.length - 2] && items[items.length - 2].map(id => elements[id]);
    const [wizardIsActive, setWizardIsActive] = useState(false);
    const [wizardCaption, setWizardCaption] = useState('Start by adding a matching pattern.');
    const handleExpanded = (value: unknown) => console.info(`Here is the value of the expanded boolean value: ${value}`);
    const firstId = [...Array(SIDEBAR_CONTAINER_COUNT).keys()][0];
    const [expandedItemIdsValues, setExpandedIdOrIds] = useState([firstId]);
    const [variablesExpanded, setVariablesExpanded] = useState(false);
    const [templatesModalNeverOpened, setTemplatesModalNeverOpened] = useState(true);
    const [templatesModalOpen, setTemplatesModalOpen] = useState(false);

    // Create a ref for the DropdownButton
    const variablesButtonRef = useRef(null);

    // TODO - only regenerate on elements change, not every render
    const cypher = generateCypher(items, elements);


    // Initialize the builder
    if (Object.keys(elements).length === 0) {
        const { newItems, newElements } = initializeBuilder();
        setItems(newItems);
        setElements(newElements);
    }

    // Sensors for the DND layout.
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 2,
            },
        }),
    );

    // Detect whether we need to update the builder blocks based on the latest state.
    useEffect(() => {
        let { newItems, newElements } = { newItems: items, newElements: elements };

        // Check if variables changed.
        const oldVariables = prevVariables.current;
        prevVariables.current = variables;

        if (JSON.stringify(oldVariables) !== JSON.stringify(variables)) {
            const result = updateBuilderVariables(items, elements, variables, schema);
            const result2 = updateBuilderNodesRelationships(result.newItems, result.newElements, schema, variables);

            newItems = result2.newItems;
            newElements = result2.newElements;
        }

        // Check if last row changed.
        const oldLastRow = prevLastRow.current;
        prevLastRow.current = lastRow;

        if (JSON.stringify(oldLastRow) !== JSON.stringify(lastRow)) {
            const result = updateCypherWizard(newItems, newElements, variables, schema);
            setWizardIsActive(true);
            setTimeout(() => setWizardIsActive(false), 500);
            newItems = result.newItems;
            newElements = result.newElements;
            setWizardCaption(result.caption);
        }

        setElements(newElements);
        setItems(newItems);
    }, [JSON.stringify(variables), JSON.stringify(lastRow)])




    useEffect(() => {
        // Only care about schema if there's at least one node label defined. 
        if (schema?.nodes) {
            const { newItems, newElements } = updateBuilderNodesRelationships(items, elements, schema, variables);
            setItems(newItems);
            setElements(newElements);
        }
    }, [JSON.stringify(schema)])



    return (
        <div style={wrapperStyle}>
            <DndContext
                sensors={sensors}
                // collisionDetection={closestCorners}
                onDragStart={(event) => handleDragStart(event, items, elements, setItems, setElements, setActiveId)}
                onDragOver={(event) => handleDragOver(event, activeId, items, setItems)}
                onDragEnd={(event) => handleDragEnd(event, activeId, items, setItems, elements, setElements, setActiveId)}
            >
                <div
                    className="left-column"
                    style={{
                        flex: 4,
                        marginRight: "0px",
                        backgroundColor: "#f0f0f0",
                        padding: "10px",
                        maxHeight: "100vh",
                        paddingBottom: 100,
                        overflowY: "scroll",
                    }}
                >
                    <Accordion isMultiple={true} expandedItemIds={expandedItemIdsValues} onChange={setExpandedIdOrIds}>
                        {[...Array(SIDEBAR_CONTAINER_COUNT).keys()].map((id, index) => (
                            <Accordion.Item itemId={id} title={sidebarCategories[index]} onExpandedChange={handleExpanded}>
                                {true ?
                                    <SideContainer

                                        key={id}
                                        id={"" + id}
                                        containerItems={expandedItemIdsValues.includes(id) ? items[id] : []}
                                        elements={elements}
                                        setElement={(id: any, element: any) => setElements({ ...elements, [id]: element })}
                                        dragging={activeId !== undefined}
                                        onClick={(
                                            id: string | number,
                                            itemRect: { width: number; left: number; top: number; height: number; }) => handleSortableItemClick(id, itemRect, items, elements, variables, schema, setActiveId, setItems, setElements)}
                                    /> : <></>
                                }
                            </Accordion.Item>
                        ))}
                    </Accordion>
                </div>
                <div
                    className="right-rows"
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        marginRight: 'auto',
                        flex: 16 /* Takes up 2 parts of the width */,
                        backgroundColor: "#f0f0f0",
                    }}
                >
                    <div style={{ padding: "10px",  }}>
                        <h4 style={{ marginBottom: '10px' }}>Builder
                            &nbsp;

                            <Tooltip type="simple">
                                <Tooltip.Trigger>
                                    <IconButton className='hidden md:inline-flex' ariaLabel='Help' size='medium'
                                        onClick={() => {
                                            const { newItems, newElements } = resetBuilderQuery(items, elements);
                                            setItems(newItems);
                                            setElements(newElements);
                                        }}  >
                                        <TrashIconOutline aria-label='Help' />
                                    </IconButton>
                                </Tooltip.Trigger>
                                <Tooltip.Content>Reset</Tooltip.Content>
                            </Tooltip>
                            &nbsp;
                            <Tooltip type="simple">
                                <Tooltip.Trigger>
                                    <IconButton className='hidden md:inline-flex' ariaLabel='Help' size='medium' onClick={() => {
                                        setTemplatesModalNeverOpened(false);
                                        setTemplatesModalOpen(true);
                                    }}  >
                                        <WrenchScrewdriverIconOutline aria-label='Help' />
                                        {templatesModalNeverOpened ? <span 
                                        style={{
                                            position: 'absolute',
                                            marginBottom: 20,
                                            transform: 'translate(50%, -50%)',
                                            background: 'grey', //  greyish blue
                                            color: 'white',
                                            marginLeft: '-3px',
                                            marginTop: '-20px',
                                            borderRadius: '15px',
                                            padding: '0.25rem',
                                            fontSize: '0.75rem',
                                            lineHeight: '1',
                                            // border: '1px solid white',
                                            display: 'inline-block',
                                            minWidth: '1.25rem',
                                            textAlign: 'center',
                                        }}>
                                            {queryTemplates?.length}
                                        </span> : <></>}
                                    </IconButton>
                                </Tooltip.Trigger>
                                <Tooltip.Content>Query templates</Tooltip.Content>
                            </Tooltip>

                        </h4>

                        {items
                            .slice(SIDEBAR_CONTAINER_COUNT + 1)
                            .map((containerItems, index) => (
                                <QueryContainer
                                    key={index + 1}
                                    id={(index + 1).toString()}
                                    activeId={activeId}
                                    elements={elements}
                                    schema={schema}
                                    variables={variables}
                                    setElement={(id: any, element: any) => {
                                        const newElements = { ...elements };
                                        newElements[id] = element;
                                        setElements(newElements);
                                    }}
                                    containerItems={containerItems}
                                    onClick={(id: any) => console.log(id)}
                                    onShiftClick={(id: any) => handleSortableItemDelete(id, items, elements, setItems, setElements, setActiveId)}
                                    dragging={activeId !== undefined}
                                />
                            ))}

                        <div style={{ border: '2px dashed #ddd', marginTop: 20 }}>
                            <div style={{ backgroundColor: "#fff", fontSize: "14px", paddingLeft: 5, paddingTop: 5 }}>
                                🧙
                                {wizardIsActive ?
                                    <img src='https://fonts.gstatic.com/s/e/notoemoji/latest/2728/512.webp' style={{ width: '18px', display: 'inline-block' }}></img>
                                    : <img src='https://fonts.gstatic.com/s/e/notoemoji/latest/2728/emoji.svg' style={{ width: '18px', display: 'inline-block' }}></img>}
                                &nbsp;Cypher Wizard:&nbsp;&nbsp;&nbsp;

                                <span style={{ color: 'grey' }}>{wizardCaption}</span>
                            </div>

                            <FooterContainer
                                key={SIDEBAR_CONTAINER_COUNT} // ordered after the sidebar containres
                                id={SIDEBAR_CONTAINER_COUNT.toString()}
                                elements={elements}
                                setElement={(id: any, element: any) => setElements({ ...elements, [id]: element })}
                                containerItems={items[SIDEBAR_CONTAINER_COUNT]}
                                onClick={(id: string | number, itemRect: { width: number; left: number; top: number; height: number; }) => handleSortableItemClick(id, itemRect, items, elements, variables, schema, setActiveId, setItems, setElements)}
                            />
                        </div>
                    </div>
                    <div style={{ padding: "10px",  }}>
                        <h4 style={{ marginBottom: '12px' }}>Query
                            &nbsp;
                            {/* {variables.length > 0 ?
                                <Tooltip type="simple">
                                    <Tooltip.Trigger>
                                        <div >
                                            <IconButton

                                                ref={variablesButtonRef}
                                                htmlAttributes={{
                                                    onClick: () => setVariablesExpanded(old => !old)
                                                }} ariaLabel={"Variables"}>
                                                <VariableIconSolid aria-label='Variables' />
                                            </IconButton>

                                            <Menu isOpen={variablesExpanded} anchorRef={variablesButtonRef} onClose={() => setVariablesExpanded(false)}>
                                                <Menu.Items htmlAttributes={{ id: 'default-menu' }}>
                                                    {variables.map((variable: any) => (
                                                        <Menu.Item isDisabled={true}
                                                            key={variable.text}
                                                            // @ts-ignore
                                                            title={<code>{variable.text}  <b>{variable.types.filter(v => v !== 'text').join(', ')}</b></code>} onExpandedChange={(expanded: boolean | ((prevState: boolean) => boolean)) => setVariablesExpanded(expanded)}>
                                                        </Menu.Item>
                                                    ))}
                                                </Menu.Items>
                                            </Menu>
                                        </div>
                                    </Tooltip.Trigger>
                                    <Tooltip.Content>Show variables</Tooltip.Content>
                                </Tooltip>
                                : <></>} */}
                            &nbsp;
                            <Tooltip type="simple">
                                <Tooltip.Trigger>
                                    <IconButton className='hidden md:inline-flex' ariaLabel='Help' size='medium' onClick={() => {
                                        const id = toast.neutral('Copied to clipboard', { shouldAutoClose: true, isCloseable: true });
                                        navigator.clipboard.writeText(cypher);
                                        toast.close(id);
                                    }}  >
                                        <ClipboardDocumentIconOutline aria-label='Help' />
                                    </IconButton>
                                </Tooltip.Trigger>
                                <Tooltip.Content>Copy to clipboard</Tooltip.Content>
                            </Tooltip>
                            &nbsp;
                            {connected ?
                                <Tooltip type="simple">
                                    <Tooltip.Trigger>
                                        <IconButton ariaLabel='Help' size='medium' onClick={() => {
                                            window.open('https://browser.neo4j.io/?connectURL=' + connection.protocol + '%2Bs%3A%2F%2F' + connection.user + '%40' + connection.uri + '%3A' + connection.port, '_blank');
                                        }}  >
                                            <PlayCircleIconOutline aria-label='Browser' />
                                        </IconButton>
                                    </Tooltip.Trigger>
                                    <Tooltip.Content>Open Browser</Tooltip.Content>
                                </Tooltip> : <></>}
                            &nbsp;



                        </h4>

                        <CodeEditor cypher={cypher} />

                    </div>
                    <div style={{ padding: "10px",  }}>
                        <QueryRunner/>
                    </div>
                </div>
                
                <DragOverlay>
                    {activeId ? <SortableBlock
                        id={activeId}
                        element={elements[activeId]}
                        onClick={() => setActiveId(undefined)}
                        onShiftClick={undefined}
                        interactive={false}
                        hasTooltip={false}
                        setElement={undefined}
                        schema={undefined}
                        variables={undefined} /> : null}
                </DragOverlay>
                <Toaster />
            </DndContext >
            <TemplatesModal
                isOpen={templatesModalOpen}
                setIsOpen={() => setTemplatesModalOpen(false)}
                templates={queryTemplates}
                elements={elements}
                items={items}
                setElements={setElements}
                setItems={setItems}
             />
        </div >
    );
}