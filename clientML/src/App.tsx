import * as React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { useEffect, useState } from "react";
import Stack from '@mui/material/Stack';
import FilterSettingsCard from './components/FilterSettingsCard';
import GeneratorSettingsCard from './components/GeneratorSettingsCard';
import Prompt from './components/Prompt';
import FixedDrawer from './components/FixedDrawer';
import Prompts from './components/Prompts';

const DrawerHeader = styled('div')(({ theme }) => ({ // from mui drawer component documentation for the specific style
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

function App() {
  const [drawer_left_is_open, setDrawerLeftIsOpen] = React.useState(true);
  const [drawer_right_is_open, setDrawerRightIsOpen] = React.useState(false);
  const [prompts_sorted, setPromptsSorted] = useState<any[]>([]);
  const [prompt_current, setPromptCurrent] = useState({id: 0, text: "", prompt_title: "", next: null});
  const [blocks_current, setBlocksCurrent] = useState<any[]>([]);
  const [branches_gateways, setBranchesGateways] = useState<{next: any[]; back: any[] }>({"next": [], "back": []}); // iirc next and back should contain pairs where the 1 is the origin and the 2 is the destination
  const [filter_is_enabled, setFilterIsEnabled] = React.useState(true);
  const [filter_threshold, setFilterThreshold] = React.useState(0.5);
  const [filter_number_of_attempts, setFilterNumberOfAttempts] = React.useState(2);
  const [generator_max_new_tokens, setGeneratorMaxNewTokens] = React.useState<any>(50);
  const [generator_seed, setGeneratorSeed] = React.useState<any>(-1);
  const [generator_temperature, setGeneratorTemperature] = React.useState<any>(1.0);
  const [generator_top_k, setGeneratorTopK] = React.useState<any>(50);
  const [generator_top_p, setGeneratorTopP] = React.useState(1.0);

  useEffect(() => {
    listPrompts();
  }, []);

  const listPrompts = () => {
    fetch("http://127.0.0.1:8000/api/prompts/").then((response) => response.json()).then((prompts) => {
      let prompts_sorted = [];
      let next_id = null;
      while(prompts_sorted.length != prompts.length) {
        for(let i = 0; i < prompts.length; ++i) {
          if(prompts[i]["next"] == next_id) {
            prompts_sorted.unshift(prompts[i]);
            next_id = prompts[i]["id"];
            break;
          }
        }
      }
      setPromptsSorted(prompts_sorted);
    });
  };

  const openPrompt = (id: number, branch: number) => async() => {
    const response_prompt = await fetch(`http://127.0.0.1:8000/api/prompts/${id}/`);
    const prompt = await response_prompt.json();

    setPromptCurrent({id: prompt["id"], prompt_title: prompt["prompt_title"], text: prompt["text"], next: prompt["next"]});
    fetch(`http://127.0.0.1:8000/api/branches/?prompt=${id}`).then((response) => response.json()).then(async(branches) => {    
      branches = branches.sort((branch_a : any, branch_b : any) => {
        if(branch_a["id"] < branch_b["id"]) {
          return -1;
        }
      });
      const current_index_branch = ((branch == 0) ? 0 : (branches.findIndex((branchy : any) => branchy["id"] === branch)));

      let blocks_from_branch: any[] = [];
      for(let i = 0; i < branches.length; ++i) {
        const response_blocks = await fetch(`http://127.0.0.1:8000/api/blocks/?branch=${branches[i]["id"]}`);
        const blocks = await response_blocks.json();
  
        let blocks_sorted = [];
        let next_id = null;
        while(blocks_sorted.length != blocks.length) {
          for (let i = 0; i < blocks.length; i++) {
            if(blocks[i]["next"] == next_id) {
              blocks_sorted.unshift(blocks[i]);
              next_id = blocks[i]["id"];
              break;
            }
          }
        }
        blocks_from_branch.push(blocks_sorted);
      }
      setBlocksCurrent(blocks_from_branch[current_index_branch]);

      let current_gateways: {next: any[]; back: any[] } = {"next": [], "back": []};
      for (let i = 0; i < (blocks_from_branch.length - 1); ++i) {
        for (let j = i + 1; j < blocks_from_branch.length; ++j) {
          for (let k = 0; k < ((blocks_from_branch[i]).length); ++k) {
            if(blocks_from_branch[i][k]["text"].replace(/<[^>]*>?/gm, '') != blocks_from_branch[j][k]["text"].replace(/<[^>]*>?/gm, '')) {
              if(!current_gateways["next"].some(gateway => gateway["block1"]["id"] == blocks_from_branch[i][k]["id"])) {
                current_gateways["next"].push({"block1": blocks_from_branch[i][k], "block2": blocks_from_branch[j][k]});
                if(!current_gateways["back"].some(gateway => gateway["block1"]["id"] == blocks_from_branch[j][k]["id"])) {
                  current_gateways["back"].push({"block1": blocks_from_branch[j][k], "block2": blocks_from_branch[i][k]});
                }
              }
              break;
            } else {
              if((k == (blocks_from_branch[i].length - 1)) || (k == (blocks_from_branch[j].length - 1))) {
                if(!current_gateways["next"].some(gateway => gateway["block1"]["id"] == blocks_from_branch[i][0]["id"])) {
                  current_gateways["next"].push({"block1": blocks_from_branch[i][0], "block2": blocks_from_branch[j][0]});
                  if(!current_gateways["back"].some(gateway => gateway["block1"]["id"] == blocks_from_branch[j][0]["id"])) {
                    current_gateways["back"].push({"block1": blocks_from_branch[j][0], "block2": blocks_from_branch[i][0]});
                  }
                }
                break;
              }
            }
          }
        }
      }
      setBranchesGateways(current_gateways); // actualiza caminos entre ramas
    }).catch(() => {
      setBlocksCurrent([]);
    });
  };

  return (
    <Box sx = {{ display: 'flex' }}>
      <FixedDrawer anchor={"left"} drawer_left_is_open={drawer_left_is_open} setDrawerLeftIsOpen={setDrawerLeftIsOpen} drawer_right_is_open={drawer_right_is_open} setDrawerRightIsOpen={setDrawerRightIsOpen}>
        <Prompts drawer_left_is_open={drawer_left_is_open} prompts_sorted={prompts_sorted} setPromptsSorted={setPromptsSorted} setPromptCurrent={setPromptCurrent} setBlocksCurrent={setBlocksCurrent} listPrompts={listPrompts} openPrompt={openPrompt}/>
      </FixedDrawer>

      <Box component="main" sx={{ flexGrow: 1, px: 5, height:"100vh"}} >
        <DrawerHeader />
        <Prompt prompt_current={prompt_current} blocks_current={blocks_current} setBlocksCurrent={setBlocksCurrent} branches_gateways={branches_gateways}
                filter_is_enabled={filter_is_enabled} filter_threshold={filter_threshold} filter_number_of_attempts={filter_number_of_attempts}
                generator_max_new_tokens={generator_max_new_tokens} generator_seed={generator_seed} generator_temperature={generator_temperature} generator_top_k={generator_top_k} generator_top_p={generator_top_p}
                listPrompts={listPrompts} openPrompt={openPrompt}/>
      </Box>

      <FixedDrawer anchor={"right"} drawer_left_is_open={drawer_left_is_open} setDrawerLeftIsOpen={setDrawerLeftIsOpen} drawer_right_is_open={drawer_right_is_open} setDrawerRightIsOpen={setDrawerRightIsOpen}>
        <Stack direction= "column" justifyContent="flex-start" alignItems="stretch" sx={{flexGrow: 1}} style={{backgroundColor: (drawer_right_is_open) ? ("#d3d6d6") : ("#25292e")}}>
          {(drawer_right_is_open) ? [(
            <FilterSettingsCard filter_is_enabled={filter_is_enabled} filter_threshold={filter_threshold} filter_number_of_attempts={filter_number_of_attempts} 
                                setFilterIsEnabled={setFilterIsEnabled} setFilterThreshold={setFilterThreshold} setFilterNumberOfAttempts={setFilterNumberOfAttempts}/>
          ), (
            <GeneratorSettingsCard generator_max_new_tokens = {generator_max_new_tokens} generator_seed = {generator_seed} generator_temperature = {generator_temperature} generator_top_k = {generator_top_k} generator_top_p = {generator_top_p}
                                   setGeneratorMaxNewTokens={setGeneratorMaxNewTokens} setGeneratorSeed={setGeneratorSeed} setGeneratorTemperature={setGeneratorTemperature} setGeneratorTopK={setGeneratorTopK} setGeneratorTopP={setGeneratorTopP}/>
          )] : ("")}
        </Stack>
      </FixedDrawer>
    </Box>
  );
}

export default App;
