import * as React from 'react';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

interface Props {
  generator_max_new_tokens: number;
  setGeneratorMaxNewTokens: React.Dispatch<React.SetStateAction<any>>;
  generator_seed: number;
  setGeneratorSeed: React.Dispatch<React.SetStateAction<any>>;
  generator_temperature: number;
  setGeneratorTemperature: React.Dispatch<React.SetStateAction<any>>;
  generator_top_k: number;
  setGeneratorTopK: React.Dispatch<React.SetStateAction<any>>;
  generator_top_p: number;
  setGeneratorTopP: React.Dispatch<React.SetStateAction<number>>;
}

const GeneratorSettingsCard: React.FC<Props> = ({ generator_max_new_tokens, setGeneratorMaxNewTokens, generator_seed, setGeneratorSeed, generator_temperature, setGeneratorTemperature, generator_top_k, setGeneratorTopK, generator_top_p, setGeneratorTopP }) => {
  const handleTopPSlider = (value: any) => {
    setGeneratorTopP(value);
  }

  return (
    <Card variant="outlined" sx={{ borderRadius: 2, mt: 2, mx: 2.5, px:4, py: 2, border: "none" }}>
      <Stack direction= "column" justifyContent="flex-start" alignItems="stretch">
        <TextField sx={{ mb: 1 }} onChange={(e) => setGeneratorMaxNewTokens(e.target.value)} label="NUMBER OF NEW TOKENS" variant="filled" value={generator_max_new_tokens} onBlur={(e) => {
          const value = parseInt(e.target.value);
          if(!isNaN(value)) {
            setGeneratorMaxNewTokens((value < 1) ? 1 : value);
          } else {
            setGeneratorMaxNewTokens(50);
          }
        }}/>
        <TextField sx={{ mb: 1  }} value={generator_seed} onChange={(e) => setGeneratorSeed(e.target.value)} label="SEED" variant="filled" onBlur={(e) => {
          const value = parseInt(e.target.value);
          if(!isNaN(value)) {
            setGeneratorSeed((value < -1) ? -1 : value);
          } else {
            setGeneratorSeed(-1);
          }
        }}/> 
        <TextField sx={{ mb: 1  }} value={generator_temperature} onChange={(e) => setGeneratorTemperature(e.target.value)} label="TEMPERATURE" variant="filled" onBlur={(e) => {
          const value = parseFloat(e.target.value);
          if(!isNaN(value)) {
            setGeneratorTemperature((value <= 0.0) ? 1.0 : value);
          } else {
            setGeneratorTemperature(1.0);
          }
        }}/>
        <TextField sx={{  mb: 1  }} value={generator_top_k} onChange={(e) => setGeneratorTopK(e.target.value)} label="TOP_K" variant="filled" onBlur={(e) => {
          const value = parseInt(e.target.value);
          if(!isNaN(value)) {
            setGeneratorTopK((value < 1) ? 1 : value);
          } else {
            setGeneratorTopK(50);
          }
        }}/>
        <Box>
          <Typography>TOP_P</Typography>
          <Slider value = {generator_top_p} valueLabelDisplay="auto" onChange={(e, val) => handleTopPSlider(val)} step={0.1} marks min = {0} max = {1}/>
        </Box>
      </Stack>
    </Card>
  );
}

export default GeneratorSettingsCard;
