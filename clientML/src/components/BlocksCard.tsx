import * as React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { ButtonGroup } from '@mui/material';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { EditorProvider, Extension} from '@tiptap/react'
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import StarterKit from '@tiptap/starter-kit'
import { Color } from '@tiptap/extension-color'
import TextStyle from '@tiptap/extension-text-style'

interface Props {
  block: any;
  index: number;
  prompt_current: any;
  blocks_current: any[];
  setBlocksCurrent: React.Dispatch<React.SetStateAction<any[]>>;
  branches_gateways: { next: any[]; back: any[] };
  setIsGenerating: React.Dispatch<React.SetStateAction<boolean>>;
  filtered_block: number;
  setFilteredBlock: React.Dispatch<React.SetStateAction<number>>;
  filter_is_enabled: boolean;
  filter_threshold: number;
  filter_number_of_attempts: number;
  generator_max_new_tokens: number;
  generator_seed: number;
  generator_temperature: number;
  generator_top_k: number;
  generator_top_p: number;
  openPrompt: (id: number, branch: number) => () => Promise<void>;
}

const BlocksCard: React.FC<Props> = ({ block, index, prompt_current, blocks_current, setBlocksCurrent, branches_gateways, setIsGenerating, filtered_block, setFilteredBlock, filter_is_enabled, filter_threshold, filter_number_of_attempts, generator_max_new_tokens, generator_seed, generator_temperature, generator_top_k, generator_top_p, openPrompt }) => {
  const editBlockText = (block: any, future_text: string) => () => {
    fetch(`http://127.0.0.1:8000/api/blocks/${block["id"]}/`, {method: 'PUT', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify({"branch": block["branch"], "next": block["next"], "text": future_text})}).then((response) => response.json()).then((block) => {
      (openPrompt(prompt_current["id"], block["branch"]))();
    });
  };

  const switchBranch = (id: number) => () => {
    fetch(`http://127.0.0.1:8000/api/blocks/?branch=${id}`).then((response) => response.json()).then((blocks) => {
      let blocks_sorted = [];
      let next_id = null;
      while(blocks_sorted.length != blocks.length) {
        for(let i = 0; i < blocks.length; i++) {
          if(blocks[i]["next"] == next_id) {
            blocks_sorted.unshift(blocks[i]);
            next_id = blocks[i]["id"];
            break;
          }
        }
      }
      setBlocksCurrent(blocks_sorted);
    })
  };

  const switchToPreviousBranch = (block: any) => () => {
    const found_gateway = branches_gateways["back"].find(gateway => gateway["block1"]["id"] == block["id"]);
    (switchBranch(found_gateway["block2"]["branch"]))();
  };

  const switchToNextBranch = (block: any) => () => {
    const found_gateway = branches_gateways["next"].find(gateway => gateway["block1"]["id"] == block["id"]);
    (switchBranch(found_gateway["block2"]["branch"]))();
  };

  const regenerateBlock = (block: number) => () => {
    setIsGenerating(true);

    let blocks_before_regenerate: any[] = []
    for(let i = 0; blocks_current[i]["id"] != block; ++i) {
      blocks_before_regenerate.push(blocks_current[i]);
    }

    if(blocks_before_regenerate.length == 0) {
      fetch(`http://127.0.0.1:8000/api/branches/`, {method: 'POST', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify({"prompt": prompt_current["id"]})}).then((response) => response.json()).then(async (branch) => {
        let generation;
        let is_filtered = false;

        if(filter_is_enabled) { 
          for(let i = 0; i < filter_number_of_attempts; ++i) {
            const response1 = await fetch(`http://127.0.0.1:8000/api/generate/`, {method: 'POST', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify({"prompt": prompt_current["text"], "text": "", "max_new_tokens": generator_max_new_tokens, "temperature": generator_temperature, "top_k": generator_top_k, "top_p": generator_top_p, ...(generator_seed != -1 ? { "seed": generator_seed } : {})})})
            generation = await response1.json()
    
            const response2 = await fetch(`http://127.0.0.1:8000/api/discriminate/`, {method: 'POST', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify({"threshold": filter_threshold, "text": generation})});
            is_filtered = await response2.json();
    
            if(!is_filtered) {
              break;
            }
          }
        } else {
          setFilteredBlock(-1);

          const response1 = await fetch(`http://127.0.0.1:8000/api/generate/`, {method: 'POST', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify({"prompt": prompt_current["text"], "text": "", "max_new_tokens": generator_max_new_tokens, "temperature": generator_temperature, "top_k": generator_top_k, "top_p": generator_top_p, ...(generator_seed != -1 ? { "seed": generator_seed } : {})})})
          generation = await response1.json()
        }

        setIsGenerating(false);
        fetch(`http://127.0.0.1:8000/api/blocks/`, {method: 'POST', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify({"branch": branch['id'], "text": "<p>" + generation + "</p>"})}).then((response) => response.json()).then((block) => {
          if(is_filtered) {
            setFilteredBlock(block["id"]);
          }
          (openPrompt(prompt_current["id"], block["branch"]))();
        });
      });
    } else {
      fetch(`http://127.0.0.1:8000/api/branches/`, {method: 'POST', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify({"prompt": prompt_current["id"]})}).then((response) => response.json()).then(async (branch) => {
        let input = "";
        for (let i = 0; i < blocks_before_regenerate.length; i++) {
          input += ("\n\n" + blocks_before_regenerate[i]["text"]);
        }
        input = input.replace(/<[^>]*>?/gm, ''); //todo lo que este entre <...> lo elimino

        let generation;
        let is_filtered = false;

        if(filter_is_enabled) { 
          for(let i = 0; i < filter_number_of_attempts; ++i) {
            const response1 = await fetch(`http://127.0.0.1:8000/api/generate/`, {method: 'POST', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify({"prompt": prompt_current["text"], "text": input, "max_new_tokens": generator_max_new_tokens, "temperature": generator_temperature, "top_k": generator_top_k, "top_p": generator_top_p, ...(generator_seed != -1 ? { "seed": generator_seed } : {})})})
            generation = await response1.json()
    
            const response2 = await fetch(`http://127.0.0.1:8000/api/discriminate/`, {method: 'POST', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify({"threshold": filter_threshold, "text": generation})});
            is_filtered = await response2.json();
    
            if(!is_filtered) {
              break;
            }
          }
        } else {
          setFilteredBlock(-1);

          const response1 = await fetch(`http://127.0.0.1:8000/api/generate/`, {method: 'POST', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify({"prompt": prompt_current["text"], "text": input, "max_new_tokens": generator_max_new_tokens, "temperature": generator_temperature, "top_k": generator_top_k, "top_p": generator_top_p, ...(generator_seed != -1 ? { "seed": generator_seed } : {})})})
          generation = await response1.json()
        }

        setIsGenerating(false);
        fetch(`http://127.0.0.1:8000/api/blocks/`, {method: 'POST', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify({"branch": branch['id'], "text": "<p>" + generation + "</p>"})})
        .then((response) => response.json())
        .then(async (regenerated_block) => {
          if(is_filtered) {
            setFilteredBlock(regenerated_block["id"]);
          }
          
          let prev_block;
          for(let i = (blocks_before_regenerate.length - 1); 0 <= i; --i) {
            if(i == (blocks_before_regenerate.length - 1)) {
              const response = await fetch(`http://127.0.0.1:8000/api/blocks/`, {method: 'POST', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify({"branch": branch['id'], "next": regenerated_block["id"], "text": blocks_before_regenerate[i]["text"]})});
              prev_block = await response.json();
            } else {
              const response = await fetch(`http://127.0.0.1:8000/api/blocks/`, {method: 'POST', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify({"branch": branch['id'], "next": prev_block["id"], "text": blocks_before_regenerate[i]["text"]})});
              prev_block = await response.json();
            }
          }
          (openPrompt(prompt_current["id"], branch['id']))();
        });
      });
    }
  };

  const deleteBlock = (block: number) => async () => {
    if(blocks_current[0]["id"] == block) {
      await fetch(`http://127.0.0.1:8000/api/blocks/?branch=${blocks_current[0]["branch"]}`, {method: 'DELETE'});
      await fetch(`http://127.0.0.1:8000/api/branches/${blocks_current[0]["branch"]}/`, {method: 'DELETE'});
      (openPrompt(prompt_current["id"], 0))();
    } else {
      let i = 0;
      do {
        ++i;
        await fetch(`http://127.0.0.1:8000/api/blocks/${blocks_current[blocks_current.length - (i + 1)]["id"]}/`, {method: 'PUT', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify({"branch": blocks_current[blocks_current.length - (i + 1)]["branch"], "next": null, "text": blocks_current[blocks_current.length - (i + 1)]["text"]})});
        await fetch(`http://127.0.0.1:8000/api/blocks/${blocks_current[blocks_current.length - i]["id"]}/`, {method: 'DELETE'});
      } while(block != blocks_current[blocks_current.length - i]["id"]); // borro el current ultimo bloque de mi lista, si ese bloque que he borrado es el bloque hasta el que quiero borrar paro
      (openPrompt(prompt_current["id"], blocks_current[0]["branch"]))();
    }
  };

  return (
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" >
      <ButtonGroup size="small" variant="outlined" sx = {{pl: 2, pt: 1}}>
        <Button sx={ { borderRadius: 4 } } aria-label="patrass" onClick={switchToPreviousBranch(block)} disabled = {((branches_gateways["back"].some(gateway => gateway["block1"]["id"] == block["id"])) ? false : true)} style={{maxWidth: '25px', maxHeight: '25px', minWidth: '25px', minHeight: '25px'}}>
          <KeyboardArrowLeftIcon />
        </Button>
        <Button sx={ { borderRadius: 4 } } aria-label="palante"  onClick={switchToNextBranch(block)} disabled = {(branches_gateways["next"].some(gateway => gateway["block1"]["id"] == block["id"])) ? false : true} style={{maxWidth: '25px', maxHeight: '25px', minWidth: '25px', minHeight: '25px'}}>
          <KeyboardArrowRightIcon />
        </Button>
      </ButtonGroup>
      <Box sx = {{ width: '100%',px: 4, ...((index == 0) ? {} : {}) }}>
        <EditorProvider key={block["text"]} content={block["text"]} children={undefined} onBlur={(provided) => (editBlockText(block, provided.editor.getHTML())())} extensions={[StarterKit, TextStyle, Color, (
          Extension.create({
            addKeyboardShortcuts() {
              return { "Enter": () => this.editor.commands.blur() }
            }
          }
        ))]}/>
      </Box>
      <ButtonGroup size="small" variant="outlined" aria-label="Basic button group" sx = {{pr: 2, pt: 1}}>
        <Button aria-label="regenerar"  onClick={regenerateBlock(block["id"])} sx = {{ borderRadius: 4, display: (block["id"] == filtered_block) ? "none" : "inline-flex"}} style={{maxWidth: '25px', maxHeight: '25px', minWidth: '25px', minHeight: '25px'}}>
          <AddIcon style={{maxWidth: '20px', maxHeight: '20px', minWidth: '20px', minHeight: '20px'}}/>
        </Button>
        <Button aria-label="delete" onClick={deleteBlock(block["id"])} sx = {{borderRadius: 4, display: (block["id"] == filtered_block) ? "none" : "inline-flex"}} style={{maxWidth: '25px', maxHeight: '25px', minWidth: '25px', minHeight: '25px'}}>
          <CloseIcon style={{maxWidth: '20px', maxHeight: '20px', minWidth: '20px', minHeight: '20px'}} />
        </Button>
      </ButtonGroup>
    </Stack>
  );
}

export default BlocksCard
