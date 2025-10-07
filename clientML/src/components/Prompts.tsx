import * as React from 'react';
import List from '@mui/material/List';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import AddIcon from '@mui/icons-material/Add';
import CancelIcon from '@mui/icons-material/Cancel';
import PromptCard from './PromptCard';

interface Props {
  drawer_left_is_open: boolean;
  prompts_sorted: any[];
  setPromptsSorted: React.Dispatch<React.SetStateAction<any[]>>;
  setPromptCurrent: React.Dispatch<React.SetStateAction<any>>;
  setBlocksCurrent: React.Dispatch<React.SetStateAction<any[]>>;
  listPrompts: () => void;
  openPrompt: (id: number, branch: number) => () => Promise<void>; 
}

const Prompts: React.FC<Props> = ({ drawer_left_is_open, prompts_sorted, setPromptsSorted, setPromptCurrent, setBlocksCurrent, listPrompts, openPrompt}) => {
  const reorderPrompts = (index_start: number, index_end: number) => {
    let result = Array.from(prompts_sorted);
    const [removed] = result.splice(index_start, 1);

    result.splice(index_end, 0, removed);
    result.push({id: null});
    for(let i = 0; i < prompts_sorted.length; ++i) {
      if(result[i]["next"] != result[i + 1]["id"]) {
        result[i] = {id: result[i]["id"], prompt_title: result[i]["prompt_title"], text: result[i]["text"], next: result[i + 1]["id"]};
        fetch(`http://127.0.0.1:8000/api/prompts/${result[i]["id"]}/`, {method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({"prompt_title": result[i]["prompt_title"], "text": result[i]["text"], "next": result[i + 1]["id"]})});
      }
    }
    result.pop();
  
    return result;
  };

  const createPrompt = () => () => {
    fetch(`http://127.0.0.1:8000/api/prompts/`, {method: 'POST', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify({"prompt_title": "", "text": "", "next": null})}).then((response) => response.json()).then((prompt) => {
      if(prompts_sorted.length != 0) {
        fetch(`http://127.0.0.1:8000/api/prompts/${prompts_sorted[prompts_sorted.length - 1]["id"]}/`, {method: 'PUT', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify({"prompt_title": prompts_sorted[prompts_sorted.length - 1]["prompt_title"], "text": prompts_sorted[prompts_sorted.length - 1]["text"], "next": prompt["id"]})}).then((response) => response.json()).then(() => {
          listPrompts();
          (openPrompt(prompt["id"], 0))();
        });
      } else {
        listPrompts();
        (openPrompt(prompt["id"], 0))();
      }
    });
  }

  const deletePrompt = (id: number) => async() => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/branches/?prompt=${id}`);
      const branches = await response.json();

      for(let i = 0; i < branches.length; ++i) {
        await fetch(`http://127.0.0.1:8000/api/blocks/?branch=${branches[i]["id"]}`, {method: 'DELETE'});
        await fetch(`http://127.0.0.1:8000/api/branches/${branches[i]["id"]}/`, {method: 'DELETE'});
      }
    } catch (error) {}
    
    const current_index_prompt = prompts_sorted.findIndex(prompt => prompt["id"] === id);
    prompts_sorted.push({id: null});
    if(prompts_sorted[0]["id"] != id) {
      prompts_sorted[current_index_prompt - 1]["next"] = prompts_sorted[current_index_prompt + 1]["id"];
      await fetch(`http://127.0.0.1:8000/api/prompts/${prompts_sorted[current_index_prompt - 1]["id"]}/`, {method: 'PUT', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify({"branch": prompts_sorted[current_index_prompt - 1]["branch"], "next": prompts_sorted[current_index_prompt + 1]["id"], "text": prompts_sorted[current_index_prompt - 1]["text"]})});
    }
    prompts_sorted.pop();
    prompts_sorted.splice(current_index_prompt, 1)
    await fetch(`http://127.0.0.1:8000/api/prompts/${id}/`, {method: 'DELETE'});
    
    listPrompts();
    if(prompts_sorted.length == 0) {
      setPromptCurrent({id: 0, text: "", prompt_title: "", next: null});
      setBlocksCurrent([])
    } else {
      (openPrompt(prompts_sorted[0]["id"], 0))();
    }
  };

  return (
    <DragDropContext onDragEnd = {(result) => {
      if(!result.destination) {
        return;
      }
      const reorderedItems = reorderPrompts(result.source.index, result.destination.index);
      setPromptsSorted(reorderedItems);
    }}>
      <Stack direction= "column" justifyContent="flex-start" alignItems="stretch" sx={{flexGrow: 1}} style={{backgroundColor: (drawer_left_is_open) ? ("#d3d6d6") : ("#25292e")}}>
        <Droppable droppableId="droppable">
          {(provided) => (
            <List {...provided.droppableProps} ref={provided.innerRef}>
              {(drawer_left_is_open) ? (prompts_sorted.map((prompt, index) => (
                <Draggable key={prompt["id"]} draggableId={prompt["id"].toString()} index={index}>
                    {(provided, snapshot) => (
                      <ListItem disablePadding sx={{ display: 'block' }} ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} secondaryAction={
                        <IconButton onClick={deletePrompt(prompt["id"])} sx={{ "position": "absolute", "right": "25px", "bottom": "30px" }}>
                              <CancelIcon style={{color: "#ffffff"}}/>
                        </IconButton>
                      }>
                        <ListItemButton style={{ whiteSpace: 'normal'}} onClick={openPrompt(prompt["id"], 0)} sx={{ px: 2.5 }}>
                          <PromptCard prompt_title = {prompt["prompt_title"]} text = {prompt["text"]}/>
                        </ListItemButton>
                      </ListItem>
                    )}
                </Draggable>
              ))): ""}
              {provided.placeholder}
            </List>
          )}
        </Droppable>
        {(drawer_left_is_open) ? (
          <Button variant="contained" style={{backgroundColor: "#25292e"}} disableElevation sx = {{ borderRadius: 2, mx: 2.5, py: 1}} onClick={createPrompt()}>
            <AddIcon />
          </Button>
        ) : ""}
      </Stack>
    </DragDropContext>
  );
}

export default Prompts;
