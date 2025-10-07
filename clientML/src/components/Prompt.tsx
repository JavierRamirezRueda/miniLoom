import * as React from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import Button from '@mui/material/Button';
import { useState } from "react";
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
import { ButtonGroup } from '@mui/material';
import BlocksCard from './BlocksCard';

interface Props {
  prompt_current: any;
  blocks_current: any[];
  setBlocksCurrent: React.Dispatch<React.SetStateAction<any[]>>;
  branches_gateways: { next: any[]; back: any[] };
  filter_is_enabled: boolean;
  filter_threshold: number;
  filter_number_of_attempts: number;
  generator_max_new_tokens: number;
  generator_seed: number;
  generator_temperature: number;
  generator_top_k: number;
  generator_top_p: number;
  listPrompts: () => void;
  openPrompt: (id: number, branch: number) => () => Promise<void>; 
}

const Prompt: React.FC<Props> = ({ prompt_current, blocks_current, setBlocksCurrent, branches_gateways, filter_is_enabled, filter_threshold, filter_number_of_attempts, generator_max_new_tokens, generator_seed, generator_temperature, generator_top_k, generator_top_p, listPrompts, openPrompt}) => {
  const [prompt_prompt_title_editable, setPromptPromptTitleEditable] = useState(false);
  const [prompt_text_editable, setPromptTextEditable] = useState(false);
  const [prompt_prompt_title_edit, setPromptPromptTitleEdit] = useState<string>();
  const [prompt_text_edit, setPromptTextEdit] = useState<string>();
  const [is_generating, setIsGenerating] = React.useState(false);
  const [filtered_block, setFilteredBlock] = useState(-1);

  const enablePromptPromptTitleEditable = () => {
    setPromptPromptTitleEditable(true);
    setPromptTextEditable(false);
  };

  const disablePromptPromptTitleEditable = () => {
    if(prompt_prompt_title_edit != undefined) {
      fetch(`http://127.0.0.1:8000/api/prompts/${prompt_current["id"]}/`, {method: 'PUT', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify({"prompt_title": prompt_prompt_title_edit, "text": prompt_current["text"]})}).then((response) => response.json()).then(() => {
        setPromptPromptTitleEdit(undefined);
        try {
          (openPrompt(prompt_current["id"], blocks_current[0]["branch"]))();
        } catch {
          (openPrompt(prompt_current["id"], 0))();
        }
        listPrompts();
      });
    }
    setPromptPromptTitleEditable(false);
  };
  
  const enablePromptTextEditable = () => {
    setPromptTextEditable(true);
    setPromptPromptTitleEditable(false);
  };

  const disablePromptTextEditable = () => {
    if(prompt_text_edit != undefined) {
      fetch(`http://127.0.0.1:8000/api/prompts/${prompt_current["id"]}/`, {method: 'PUT', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify({"prompt_title": prompt_current["prompt_title"], "text": prompt_text_edit})}).then((response) => response.json()).then(() => {
        setPromptTextEdit(undefined);
        try {
          (openPrompt(prompt_current["id"], blocks_current[0]["branch"]))();
        } catch {
          (openPrompt(prompt_current["id"], 0))();
        }
        listPrompts();
      });
    }
    setPromptTextEditable(false);
  };

  const write = () => () => {
    if(blocks_current.length == 0) {
      fetch(`http://127.0.0.1:8000/api/branches/`, {method: 'POST', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify({"prompt": prompt_current["id"]})}).then((response) => response.json()).then((branch) => {
        fetch(`http://127.0.0.1:8000/api/blocks/`, {method: 'POST', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify({"branch": branch['id'], "text": "<p>...</p>"})}).then((response) => response.json()).then((block) => {
          (openPrompt(prompt_current["id"], block["branch"]))();
        });
      });
    } else {
      fetch(`http://127.0.0.1:8000/api/blocks/`, {method: 'POST', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify({"branch": blocks_current[0]["branch"], "text": "<p>...</p>"})}).then((response) => response.json()).then((block) => {
        fetch(`http://127.0.0.1:8000/api/blocks/${blocks_current[blocks_current.length - 1]["id"]}/`, {method: 'PUT', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify({"branch": blocks_current[blocks_current.length - 1]["branch"], "next": block["id"], "text": blocks_current[blocks_current.length - 1]["text"]})}).then((response) => response.json()).then((block2) => {
          (openPrompt(prompt_current["id"], block2["branch"]))();
        });
      });
    }
  };

  const generate = () => async () => {
    setIsGenerating(true);
    if(blocks_current.length == 0) {
      fetch(`http://127.0.0.1:8000/api/branches/`, {method: 'POST', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify({"prompt": prompt_current["id"], })}).then((response) => response.json()).then(async (branch) => {
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
      let input = "";
      for (let i = 0; i < blocks_current.length; i++) {
        input += ("\n\n" + blocks_current[i]["text"]);
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
      fetch(`http://127.0.0.1:8000/api/blocks/`, {method: 'POST', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify({"branch": blocks_current[0]["branch"], "text": "<p>" + generation + "</p>"})}).then((response) => response.json()).then((block) => {
        if(is_filtered) {
          setFilteredBlock(block["id"]);
        }
        fetch(`http://127.0.0.1:8000/api/blocks/${blocks_current[blocks_current.length - 1]["id"]}/`, {method: 'PUT', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify({"branch": blocks_current[blocks_current.length - 1]["branch"], "next": block["id"], "text": blocks_current[blocks_current.length - 1]["text"]})}).then((response) => response.json()).then((block) => {
          (openPrompt(prompt_current["id"], block["branch"]))();
        });
      });
    }
  };

  const regenerateFromFilter = (block: any) => async () => {
    setIsGenerating(true);
    let before_regenerate: any[] = []
    for(let i = 0; blocks_current[i]["id"] != block["id"]; i++) {
      before_regenerate.push(blocks_current[i]);
    }

    let input = "";
    for (let i = 0; i < before_regenerate.length; i++) {
      input += ("\n\n" + before_regenerate[i]["text"]);
    }
    input = input.replace(/<[^>]*>?/gm, ''); //todo lo que este entre <...> lo elimino

    let generation;
    let is_filtered = false;
    for(let i = 0; i < filter_number_of_attempts; ++i) {
      const response1 = await fetch(`http://127.0.0.1:8000/api/generate/`, {method: 'POST', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify({"prompt": prompt_current["text"], "text": input, "max_new_tokens": generator_max_new_tokens, "temperature": generator_temperature, "top_k": generator_top_k, "top_p": generator_top_p, ...(generator_seed != -1 ? { "seed": generator_seed } : {})})})
      generation = await response1.json()

      const response2 = await fetch(`http://127.0.0.1:8000/api/discriminate/`, {method: 'POST', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify({"threshold": filter_threshold, "text": generation})});
      is_filtered = await response2.json();
      if(!is_filtered) {
        break;
      }
    }

    setIsGenerating(false);
    fetch(`http://127.0.0.1:8000/api/blocks/${block["id"]}/`, {method: 'PUT', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify({"text": generation, "branch": block["branch"]})}).then((response) => response.json()).then((block) => {
      if(!is_filtered) {
        setFilteredBlock(-1);
      }
      (openPrompt(prompt_current["id"], block["branch"]))();
    });
  };

  return (
    <Box>
      {(prompt_current["id"] == 0) ? ("") : (
        <Card variant="outlined" style = {{ border: "none" }} sx = {{ borderRadius: 2}}>
          <Box sx={{ py: 3, px: 4, minHeight:"70px" }} style={{backgroundColor: "#25292e"}}>
            <Box onClick={enablePromptPromptTitleEditable} sx={{ py: ((prompt_current["prompt_title"] == "") ? 1 : 0), display: prompt_prompt_title_editable ? "none" : "block"}}>
              <Typography sx = {{"fontWeight": "bold", color: "#ffffff"}}>{prompt_current["prompt_title"]}</Typography>
            </Box>
            <TextField fullWidth variant="outlined" key={prompt_current["prompt_title"]} defaultValue={prompt_current["prompt_title"]} onChange={(event) => setPromptPromptTitleEdit(event.target.value)} onKeyDown = {(event) => {if (event.key === 'Enter') disablePromptPromptTitleEditable()}}  sx = {{input: { color: "#ffffff" }, "& .MuiOutlinedInput-notchedOutline": {borderColor:"#e0e3e7"}, '& .MuiOutlinedInput-root': { '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#b2bac2' } }, display: prompt_prompt_title_editable ? "block" : "none"}}/>
          </Box>
          <Divider />
          <Box sx={{ px: 4, py: 3 }} style={{backgroundColor: "#d3d6d6"}}>
            <Box onClick={enablePromptTextEditable} sx={{ py: ((prompt_current["text"] == "") ? 1 : 0), display: prompt_text_editable ? "none" : "block"}}>  
              <Typography>{prompt_current["text"]}</Typography>
            </Box>
            <TextField fullWidth multiline variant="outlined" key={prompt_current["text"]} defaultValue={prompt_current["text"]} onChange={(event) => setPromptTextEdit(event.target.value)} onKeyDown = {(event) => {if (event.key === 'Enter') disablePromptTextEditable()}} sx = {{display: prompt_text_editable ? "block" : "none"}}/>
          </Box>
        </Card>
      )}
      {((blocks_current.length == 0)) ? ("") : (
        <Card variant="outlined" sx={{ mt: 2, borderRadius: 2 }}>
          <List disablePadding>
            {blocks_current.map((block, index) => (
              <ListItem key={block["id"]} disablePadding sx={{ display: 'block' }} >
                {(index == 0) ? "" : (<Divider/>)}
                {(block["id"] == filtered_block) ? 
                <Card style={{backgroundColor: "#ff6a53"}} elevation={0} sx = {{my:2, mx:2, borderRadius: 2}}>
                  <Box sx={{ py: 3, px: 4 }}>
                    <Typography>
                      None of the generated attempts where permitted by our filter, we recommend carefully reviewing all the written text and making another attempt.<br/>
                      You can also reveal the last attempt if you're comfortable with the associated risk.
                    </Typography>
                    <ButtonGroup disableElevation sx={{pt:2}}variant="outlined">
                      <Button variant="contained" sx = {{borderRadius: 2}} onClick={regenerateFromFilter(block)}>TRY AGAIN</Button>
                      <Button variant="outlined" sx = {{borderRadius: 2}} style={{color: "#ffffff", borderColor: "#ffffff"}} onClick={() => setFilteredBlock(-1)}>SHOW</Button>
                    </ButtonGroup>
                  </Box>
                </Card>
                : (
                  <BlocksCard block={block} index={index}
                              prompt_current={prompt_current} blocks_current={blocks_current} setBlocksCurrent={setBlocksCurrent} branches_gateways={branches_gateways} setIsGenerating={setIsGenerating} filtered_block={filtered_block} setFilteredBlock={setFilteredBlock}
                              filter_is_enabled={filter_is_enabled} filter_threshold={filter_threshold} filter_number_of_attempts={filter_number_of_attempts}
                              generator_max_new_tokens={generator_max_new_tokens} generator_seed={generator_seed} generator_temperature={generator_temperature} generator_top_k={generator_top_k} generator_top_p={generator_top_p}
                              openPrompt={openPrompt}/>
                )}
              </ListItem>
            ))}
          </List>
        </Card>
      )}
      {(is_generating) ? (<Typography sx={{pt:2}}>...</Typography>) : ""}
      {((prompt_current["text"] == "") || is_generating) ? "" : (
        <ButtonGroup disableElevation variant="contained" fullWidth sx = {{pt: 2}}>
          <Button style={{backgroundColor: "#25292e", borderColor: "#ffffff"}} sx = {{ py: 1, borderRadius: 2}} onClick={write()}>WRITE</Button>
          <Button style={{backgroundColor: "#25292e"}} sx = {{ py: 1, borderRadius: 2}} onClick={generate()}>GENERATE</Button>
        </ButtonGroup>
      )}
    </Box>
  );
}

export default Prompt;
