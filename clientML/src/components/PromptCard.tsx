import * as React from 'react';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import TextTruncate from 'react-text-truncate';
import Box from '@mui/material/Box';

interface Props {
  prompt_title: string;
  text: string;
}

const PromptCard: React.FC<Props> = ({ prompt_title, text }) => {
  return (
    <Card variant="outlined" style = {{border: "none"}} sx = {{ borderRadius: 2, flexGrow: 1, height: 170, minWidth: 360 }}>
      <Box sx={{ pl: 4, pr:9, py: 3, minHeight:"70px" }} style={{backgroundColor: "#25292e"}} > 
        <Typography component={'span'} sx = {{"fontWeight": "bold", color: "#ffffff"}}>
          <TextTruncate text={prompt_title}/>
        </Typography>
      </Box>
      <Box sx={{ pl: 4, pr:4, pt: 3 }}>
        <Typography component={'span'}>
          <TextTruncate line={2} text={text}/>
        </Typography>
      </Box>
    </Card>
  );
}

export default PromptCard;
