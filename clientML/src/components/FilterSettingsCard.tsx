import * as React from 'react';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Slider from '@mui/material/Slider';
import FormControl from '@mui/material/FormControl';
import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';

interface Props {
  filter_is_enabled: boolean;
  setFilterIsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  filter_threshold: number;
  setFilterThreshold: React.Dispatch<React.SetStateAction<number>>;
  filter_number_of_attempts: number;
  setFilterNumberOfAttempts: React.Dispatch<React.SetStateAction<number>>;
}

const FilterSettingsCard: React.FC<Props> = ({ filter_is_enabled, setFilterIsEnabled, filter_threshold, setFilterThreshold, filter_number_of_attempts, setFilterNumberOfAttempts }) => {
  const handleFilterCheckbox = () => {
    if(filter_is_enabled) {
      setFilterThreshold(0.5);
      setFilterNumberOfAttempts(2);
    }
    setFilterIsEnabled((filter_is_enabled) ? false : true);
  };

  const handleThresholdSlider = (value: any) => {
    setFilterThreshold(value);
  }

  return (
    <Card variant="outlined" sx={{ borderRadius: 2, mt: 2, mx: 2.5, py: 2, px:4, border: "none" }}>
      <FormGroup  >
        <FormControlLabel control={<Checkbox checked={filter_is_enabled} onChange={handleFilterCheckbox}/>} label="ENABLE FILTER" />
      </FormGroup>
      <Box >
        <Typography>THRESHOLD</Typography>
        <Slider disabled = {!filter_is_enabled} value = {filter_threshold} valueLabelDisplay = "auto" onChange={(e, val) => handleThresholdSlider(val)} step={0.1} marks min = {0} max = {1}/>
      </Box>
      <FormControl >
        <Typography>TIMES TO TRY AGAIN</Typography>
        <RadioGroup row name="row-radio-buttons-group" value = {filter_number_of_attempts} onChange={(e, val) => setFilterNumberOfAttempts(parseInt(val))}>
          <FormControlLabel disabled={!filter_is_enabled} value="1" control={<Radio />} label="1" />
          <FormControlLabel disabled={!filter_is_enabled} value="2" control={<Radio />} label="2" />
          <FormControlLabel disabled={!filter_is_enabled} value="3" control={<Radio />} label="3" />
          <FormControlLabel disabled={!filter_is_enabled} value="4" control={<Radio />} label="4" />
          <FormControlLabel disabled={!filter_is_enabled} value="5" control={<Radio />} label="5" />
        </RadioGroup>
      </FormControl>
    </Card>
  );
}

export default FilterSettingsCard;
